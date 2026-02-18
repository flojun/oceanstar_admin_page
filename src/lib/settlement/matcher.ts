// Settlement matcher engine
// Virtual merge, tag-based precision classifier, ±10% validation

import { supabase } from '../supabase';
import {
    SettlementRow,
    MergedReservation,
    MatchResult,
    MatchStatus,
    ProductPrice,
    SettlementSummary,
    ExcelGroup,
    ClassifierResult,
} from '../../types/settlement';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';

// ===========================
// 0. Excel Grouping (Double Aggregation)
// ===========================

// Helper to normalize pickup location (remove parens and content, remove spaces)
export function normalizePickup(pickup: string): string {
    // Remove content inside parentheses (e.g., "(Lobby)") and remove all spaces
    return pickup.replace(/\(.*\)/g, '').replace(/\s+/g, '').trim();
}

/**
 * Validates and extracts date override from note.
 * Pattern: (M/D) or (MM/DD) e.g., "(2/6)" -> "2026-02-06"
 * Returns null if no valid date found.
 */
function extractDateOverride(note: string, originalYear: string): string | null {
    const match = note.match(/\(\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\)/);
    if (match) {
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        return `${originalYear}-${month}-${day}`;
    }
    return null;
}

/**
 * Groups raw Excel rows.
 * LOGIC:
 * 1. Sort by Customer Name (asc) -> Receipt Date (asc) -> Tour Date (asc).
 * 2. Iterate and merge if:
 *    - Same Name AND
 *    - (Current Date - Previous Group's LAST Date) <= 1 day.
 * 3. Representative Date: The MIN date of the group (implicitly the first one due to sorting).
 */
function groupExcelRows(rows: SettlementRow[]): ExcelGroup[] {
    // 1. Sort
    const sorted = [...rows].sort((a, b) => {
        const nameA = a.customerName.replace(/\s+/g, '').toLowerCase();
        const nameB = b.customerName.replace(/\s+/g, '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;

        // If names equal, sort by Date Key (Receipt Date -> Tour Date)
        const dateA = a.receiptDate || a.tourDate;
        const dateB = b.receiptDate || b.tourDate;
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
    });

    const groups: ExcelGroup[] = [];
    let currentGroup: ExcelGroup | null = null;
    let lastDateInGroup: Date | null = null;

    for (const row of sorted) {
        const normName = row.customerName.replace(/\s+/g, '').toLowerCase();
        const rowDateStr = row.receiptDate || row.tourDate;
        const rowDate = parseISO(rowDateStr);

        // Check if we can merge with current group
        let isMergeable = false;
        if (currentGroup && lastDateInGroup) {
            const groupName: string = currentGroup.customerName.replace(/\s+/g, '').toLowerCase();
            if (groupName === normName) {
                const diff = differenceInCalendarDays(rowDate, lastDateInGroup);
                if (Math.abs(diff) <= 1) { // 0 or 1 day diff from LAST row
                    isMergeable = true;
                }
            }
        }

        if (isMergeable && currentGroup) {
            // MERGE
            currentGroup.rows.push(row);
            currentGroup.totalAmount += row.platformAmount;
            currentGroup.totalPax += row.pax;
            currentGroup.adultCount += row.adultCount;
            currentGroup.childCount += row.childCount;

            // Merge Options (Unique)
            if (row.option) {
                const currentOptions = (currentGroup.option || '').split(' + ').filter(Boolean);
                if (!currentOptions.includes(row.option)) {
                    currentGroup.option = currentGroup.option ? `${currentGroup.option} + ${row.option}` : row.option;
                }
            }

            // Should Representative Date update? 
            // User Request: Use MIN Date. Since sorted, currentGroup.date (first row) is already Min.
            // We just update lastDateInGroup for the NEXT chaining check.
            if (rowDate > lastDateInGroup!) {
                lastDateInGroup = rowDate;
            }
        } else {
            // NEW GROUP
            // Group Key is somewhat arbitrary now since we merged days.
            // We use the first row's data as representative.
            currentGroup = {
                groupId: `${normName}|${rowDateStr}`, // Key based on First Date
                customerName: row.customerName,
                tourDate: row.tourDate,
                receiptDate: row.receiptDate, // Representative Receipt Date (Min)
                option: row.option, // Representative Option (First)
                totalAmount: row.platformAmount,
                totalPax: row.pax,
                adultCount: row.adultCount,
                childCount: row.childCount,
                rows: [row],
                isPartialRefund: false,
                isFullCancellation: false,
            };
            groups.push(currentGroup);
            lastDateInGroup = rowDate;
        }
    }

    // Refund Logic (Post-processing)
    for (const group of groups) {
        const hasNegativeRow = group.rows.some(r => r.platformAmount < 0);
        const hasCancelText = group.rows.some(r => r.status.includes('취소') || r.productName.includes('취소'));

        if (group.totalAmount <= 0) {
            group.isFullCancellation = true;
        } else if (hasNegativeRow || hasCancelText) {
            group.isPartialRefund = true;
        }
    }

    return groups;
}

// ===========================
// 1. Fetch product_prices
// ===========================

export async function fetchProductPrices(): Promise<ProductPrice[]> {
    const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('product_prices fetch error:', error);
        return [];
    }
    return (data || []) as ProductPrice[];
}

// ===========================
// 2. Fetch & Virtual Merge DB reservations
// ===========================

export async function fetchAndMergeReservations(
    sourceCode: string,
    startDate?: string,
    endDate?: string,
    dateField: 'tour_date' | 'receipt_date' = 'tour_date'
): Promise<MergedReservation[]> {
    let query = supabase
        .from('reservations')
        .select('*')
        .ilike('source', sourceCode)
        .neq('status', '취소');
    // .is('settlement_status', null); // Removed to allow matching 'Completed' items

    if (startDate) query = query.gte(dateField, startDate);
    if (endDate) query = query.lte(dateField, endDate);

    const { data, error } = await query;
    if (error) {
        console.error('reservations fetch error:', error);
        return [];
    }

    console.log(`[Settlement] Fetched ${(data || []).length} reservations for source="${sourceCode}", date range: ${startDate} ~ ${endDate}`);
    const merged = virtualMerge(data || []);
    console.log(`[Settlement] Virtual merged into ${merged.length} groups`);
    return merged;
}

/**
 * Virtual Merge: group by name + RECEIPT_DATE (or matching_date if missing) + PICKUP
 */
function virtualMerge(rows: Record<string, unknown>[]): MergedReservation[] {
    const groups = new Map<string, Record<string, unknown>[]>();

    rows.forEach(r => {
        const name = String(r.name || '').trim();
        const tourDate = String(r.tour_date || '').trim();
        const note = String(r.note || '').trim();
        const receiptDate = String(r.receipt_date || '').trim();

        // 1. Date Override Logic
        const originalYear = (tourDate || '').split('-')[0] || '2026';
        let overrideDate = extractDateOverride(note, originalYear);

        // Fix: Ignore override if it matches receiptDate (likely just a note, not a reschedule)
        if (overrideDate === receiptDate) {
            overrideDate = null;
        }

        const matchingDate = overrideDate || tourDate;

        // 2. Pickup Normalization
        const pickup = normalizePickup(String(r.pickup_location || ''));

        // 3. Grouping Key
        // User Request: Merge multiple tour dates if from same booking (Same Receipt Date).
        const dateKey = receiptDate ? `RD:${receiptDate}` : `TD:${matchingDate}`;

        // Key: Name + DateKey + Pickup
        const key = `${name}|${dateKey}|${pickup}`;

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({
            ...r,
            _matchingDate: matchingDate
        });
    });

    const merged: MergedReservation[] = [];

    groups.forEach((group, key) => {
        const first = group[0];
        // Representative Date: based on first row's matching date
        const matchingDate = (first as any)._matchingDate;

        const options = group
            .map(r => String(r.option || '').trim())
            .filter(Boolean);
        const uniqueOptions = [...new Set(options)];

        const allTourDates = [...new Set(group.map(r => (r as any)._matchingDate))].sort();
        const totalPax = parsePaxString(String(first.pax || ''));

        // Pax/Child logic
        const allNotes = group.map(r => `${r.note || ''} ${r.pickup_location || ''}`).join(' ');
        const extractedChild = extractChildCount(allNotes);
        const dbChild = parseInt(String(first.child_count || '0'), 10);

        // Prioritize extracted count from notes if found, otherwise use DB column
        const childCount = extractedChild > 0 ? extractedChild : dbChild;
        const adultCount = Math.max(0, totalPax - childCount);

        merged.push({
            groupKey: key,
            name: String(first.name || ''),
            receiptDate: String(first.receipt_date || ''),
            tourDate: String(matchingDate),
            allTourDates,
            mergedOption: uniqueOptions.join(' + '),
            originalOptions: uniqueOptions,
            totalPax,
            adultCount,
            childCount,
            reservationIds: group.map(r => String(r.id)),
            source: String(first.source || ''),
            status: String(first.status || ''),
            contact: String(first.contact || ''),
            note: String(first.note || ''),
            pickupLocation: String(first.pickup_location || ''),
            settlementStatus: (first.settlement_status as any) || null,
        });
    });

    return merged;
}

export function classifyProduct(
    options: string[],
    productPrices: ProductPrice[]
): ClassifierResult {
    const tags = extractTags(options);
    const hasTurtle = tags.has1bu || tags.has2bu || tags.hasTurtleKeyword;
    const hasSunset = tags.has3bu || tags.hasSunset;
    const notes: string[] = [];

    // --- Complex Combinations ---

    // 1. Turtle + Parasail
    if (hasTurtle && tags.hasParasail) {
        const product = findProductByName(productPrices, '거북이 + 패러');
        return {
            productName: '거북이+패러',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // 2. Turtle + Jetski
    if (hasTurtle && tags.hasJetski) {
        const product = findProductByName(productPrices, '거북이 + 제트');
        return {
            productName: '거북이+제트',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // 3. Parasail + Jetski
    if (tags.hasParasail && tags.hasJetski) {
        const product = findProductByName(productPrices, '패러 + 제트');
        return {
            productName: '패러+제트',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // --- Single Items ---

    // 4. Turtle Only
    if (hasTurtle && !tags.hasParasail && !tags.hasJetski) {
        const product = findProductByName(productPrices, '거북이 스노클링');
        return {
            productName: '1/2부',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // 5. Sunset Only
    if (hasSunset) {
        const product = findProductByName(productPrices, '선셋');
        return {
            productName: '3부',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // 6. Parasail Only
    if (tags.hasParasail && !tags.hasJetski) {
        const product = findProductByName(productPrices, '패러세일링');
        return {
            productName: '패러',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // 7. Jetski Only
    if (tags.hasJetski && !tags.hasParasail) {
        const product = findProductByName(productPrices, '제트스키');
        return {
            productName: '제트',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // --- Fallback / Anomaly ---
    return {
        productName: '[알 수 없는 조합]',
        matchedProduct: null,
        isAnomaly: true,
        notes: [`식별불가 옵션: ${options.join(', ')}`],
    };
}

function extractTags(options: string[]): {
    has1bu: boolean;
    has2bu: boolean;
    has3bu: boolean;
    hasSunset: boolean;
    hasParasail: boolean;
    hasJetski: boolean;
    hasTurtleKeyword: boolean;
} {
    const joined = options.map(o => o.toLowerCase()).join(' ');
    return {
        has1bu: joined.includes('1부') || joined.includes('09:00'),
        has2bu: joined.includes('2부') || joined.includes('13:00'),
        has3bu: joined.includes('3부'),
        hasSunset: joined.includes('선셋'),
        hasParasail: joined.includes('패러'),
        hasJetski: joined.includes('제트'),
        hasTurtleKeyword: joined.includes('거북이') || joined.includes('turtle'),
    };
}

function findProductByName(prices: ProductPrice[], namePart: string): ProductPrice | null {
    return prices.find(p => p.product_name.includes(namePart)) || null;
}

export function matchSettlementData(
    rawExcelRows: SettlementRow[],
    dbGroups: MergedReservation[],
    productPrices: ProductPrice[]
): MatchResult[] {
    const results: MatchResult[] = [];
    const matchedDbKeys = new Set<string>();

    const excelGroups = groupExcelRows(rawExcelRows);

    console.log(`[Settlement Match] Raw Rows: ${rawExcelRows.length} -> Excel Groups: ${excelGroups.length}`);

    for (const exGroup of excelGroups) {

        // 1. Refund Status
        if (exGroup.isFullCancellation) {
            const classified = classifyProduct([exGroup.rows[0].productName], productPrices);
            results.push({
                status: 'cancelled',
                statusLabel: '취소',
                classifiedProductName: classified.productName,
                excelGroup: exGroup,
                dbGroup: null,
                matchedProduct: null,
                expectedAmount: 0,
                actualAmount: exGroup.totalAmount,
                amountDiff: 0,
                diffPercent: 0,
                notes: ['전액 환불(취소)된 예약입니다.'],
            });
            continue;
        }

        // 2. Find Best Match
        let bestMatch: MergedReservation | null = null;
        let dateMismatchWarning: string | null = null;

        // Strategy 1: Match by Name + Receipt Date (Exact OR ±1 day)
        if (exGroup.receiptDate) {
            bestMatch = dbGroups.find(dbg => {
                if (matchedDbKeys.has(dbg.groupKey)) return false;

                const dbName = dbg.name.replace(/\s+/g, '').toLowerCase();
                const exName = exGroup.customerName.replace(/\s+/g, '').toLowerCase();
                const nameMatch = dbName && exName && (dbName === exName || dbName.includes(exName) || exName.includes(dbName));
                if (!nameMatch) return false;

                if (!dbg.receiptDate) return false;

                const dbReceipt = parseISO(dbg.receiptDate);
                const exReceipt = parseISO(exGroup.receiptDate!);
                const diff = Math.abs(differenceInCalendarDays(dbReceipt, exReceipt));

                return diff <= 1;
            }) || null;

            if (bestMatch) {
                const dbReceipt = parseISO(bestMatch.receiptDate);
                const exReceipt = parseISO(exGroup.receiptDate!);
                const receiptDiff = Math.abs(differenceInCalendarDays(dbReceipt, exReceipt));

                if (receiptDiff > 0) {
                    dateMismatchWarning = `⚠️ 접수일 1일 차이 (엑셀: ${formatDateShort(exGroup.receiptDate!)} vs DB: ${formatDateShort(bestMatch.receiptDate)})`;
                }

                // Check Tour Date difference
                if (exGroup.tourDate) {
                    const exDate = parseISO(exGroup.tourDate);

                    // Find closest date in DB group
                    let minDiff = 999;
                    let closestDate = '';

                    if (bestMatch.allTourDates && bestMatch.allTourDates.length > 0) {
                        for (const dStr of bestMatch.allTourDates) {
                            const d = parseISO(dStr);
                            const diff = Math.abs(differenceInCalendarDays(d, exDate));
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestDate = dStr;
                            }
                        }
                    } else {
                        const d = parseISO(bestMatch.tourDate);
                        minDiff = Math.abs(differenceInCalendarDays(d, exDate));
                        closestDate = bestMatch.tourDate;
                    }

                    // Update bestMatch.tourDate to be the closest one for display
                    bestMatch.tourDate = closestDate;

                    if (minDiff > 1) {
                        const existing = dateMismatchWarning ? dateMismatchWarning + ', ' : '';
                        dateMismatchWarning = `${existing}⚠️ 투어일 불일치 (엑셀: ${formatDateShort(exGroup.tourDate)} vs DB: ${formatDateShort(bestMatch.tourDate)})`;
                    }
                }


            }
        }

        // Strategy 2: Match by Name + Tour Date (+/- 1 day)
        if (!bestMatch) {
            for (const dbg of dbGroups) {
                if (matchedDbKeys.has(dbg.groupKey)) continue;

                const dbName = dbg.name.replace(/\s+/g, '').toLowerCase();
                const exName = exGroup.customerName.replace(/\s+/g, '').toLowerCase();
                const nameMatch = dbName && exName && (dbName.includes(exName) || exName.includes(dbName));

                if (!nameMatch) continue;

                const exDate = parseISO(exGroup.tourDate);
                let toleranceMatch = false;
                let exactMatch = false;
                let closestDate = dbg.tourDate;

                if (dbg.allTourDates && dbg.allTourDates.length > 0) {
                    for (const dStr of dbg.allTourDates) {
                        const d = parseISO(dStr);
                        const diff = Math.abs(differenceInCalendarDays(d, exDate));
                        if (diff === 0) exactMatch = true;
                        if (diff <= 1) toleranceMatch = true;
                        if (diff === 0) closestDate = dStr;
                        else if (!exactMatch && diff <= 1) closestDate = dStr;
                    }
                } else {
                    const diff = Math.abs(differenceInCalendarDays(parseISO(dbg.tourDate), exDate));
                    if (diff === 0) exactMatch = true;
                    if (diff <= 1) toleranceMatch = true;
                }

                if (exactMatch) {
                    bestMatch = dbg;
                    bestMatch.tourDate = closestDate;
                    dateMismatchWarning = null;
                    break;
                }
                if (toleranceMatch && !bestMatch) {
                    bestMatch = dbg;
                    bestMatch.tourDate = closestDate;
                    dateMismatchWarning = null;
                }
            }
        }

        // 3. Process Match
        if (bestMatch) {
            matchedDbKeys.add(bestMatch.groupKey);
            const classified = classifyProduct(bestMatch.originalOptions, productPrices);

            let expectedAmount = 0;
            if (classified.matchedProduct) {
                expectedAmount =
                    (bestMatch.adultCount * classified.matchedProduct.adult_price) +
                    (bestMatch.childCount * classified.matchedProduct.child_price);
            }

            const diff = exGroup.totalAmount - expectedAmount;
            const diffAbs = Math.abs(diff);
            const errorMargin = expectedAmount * 0.1; // 10%

            let status: MatchStatus = 'normal';
            let statusLabel = '정상';
            const notes = [...classified.notes];

            if (dateMismatchWarning) {
                notes.push(dateMismatchWarning);
            }

            // Check Settlement Status first
            if (bestMatch.settlementStatus === 'completed') {
                status = 'completed';
                statusLabel = '정산완료';
                notes.push('이미 정산 확정된 내역입니다.');
            } else if (bestMatch.settlementStatus === 'excluded') {
                status = 'excluded';
                statusLabel = '정산제외';
                notes.push('정산 제외 처리된 내역입니다.');
            } else if (exGroup.isPartialRefund) {
                status = 'partial_refund';
                statusLabel = '부분환불';
                notes.push('부분 환불 내역이 포함되어 있습니다.');
            } else if (expectedAmount > 0 && diffAbs > errorMargin) {
                status = 'warning';
                statusLabel = '확인필요';

                const dbNotesFn = (bestMatch.note + ' ' + bestMatch.pickupLocation).toLowerCase();
                const hasTrigger = dbNotesFn.includes('추가') || dbNotesFn.includes('$') || dbNotesFn.includes('add');

                if (diff < 0 && hasTrigger && classified.matchedProduct) {
                    const altExpected = bestMatch.totalPax * classified.matchedProduct.child_price;
                    const altDiff = exGroup.totalAmount - altExpected;

                    if (Math.abs(altDiff) <= altExpected * 0.1) {
                        status = 'normal';
                        statusLabel = '현장결제';
                        notes.push('🟢 현장 추가결제 건으로 승인 (플랫폼: 전원 아동가 적용)');
                    }
                }
            } else if (!classified.matchedProduct) {
                status = 'warning';
                statusLabel = '상품미확인';
            } else if (classified.isAnomaly) {
                status = 'warning';
                statusLabel = '조합오류';
            }

            results.push({
                status,
                statusLabel,
                classifiedProductName: classified.productName,
                excelGroup: exGroup,
                dbGroup: bestMatch,
                matchedProduct: classified.matchedProduct,
                expectedAmount,
                actualAmount: exGroup.totalAmount,
                amountDiff: diff,
                diffPercent: expectedAmount ? (diff / expectedAmount) * 100 : 0,
                notes,
            });

        } else {
            const classified = classifyProduct([exGroup.rows[0].productName], productPrices);
            results.push({
                status: 'error',
                statusLabel: 'DB없음',
                classifiedProductName: classified.productName,
                excelGroup: exGroup,
                dbGroup: null,
                matchedProduct: null,
                expectedAmount: 0,
                actualAmount: exGroup.totalAmount,
                amountDiff: exGroup.totalAmount,
                diffPercent: 100,
                notes: ['DB에서 해당 예약(이름+날짜)을 찾을 수 없습니다.'],
            });
        }
    }

    // 4. Identify Unmatched DB Groups (Saturday Carry-over)
    for (const dbg of dbGroups) {
        if (!matchedDbKeys.has(dbg.groupKey)) {
            const date = parseISO(dbg.tourDate);
            const isSaturday = date.getDay() === 6;

            if (isSaturday) {
                results.push({
                    status: 'warning',
                    statusLabel: '이월대기',
                    classifiedProductName: '-',
                    excelGroup: null,
                    dbGroup: dbg,
                    matchedProduct: null,
                    expectedAmount: 0,
                    actualAmount: 0,
                    amountDiff: 0,
                    diffPercent: 0,
                    notes: [`🕒 토요일 투어 (${formatDateShort(dbg.tourDate)}) - 다음 주 정산 확인 필요`],
                });
            }
        }
    }

    return results;
}

export function calculateSummary(results: MatchResult[]): SettlementSummary {
    const normal = results.filter(r => r.status === 'normal').length;
    const warning = results.filter(r => r.status === 'warning').length;
    const error = results.filter(r => r.status === 'error').length;
    const partialRefund = results.filter(r => r.status === 'partial_refund').length;
    const cancelled = results.filter(r => r.status === 'cancelled').length;
    const completed = results.filter(r => r.status === 'completed').length;
    const excluded = results.filter(r => r.status === 'excluded').length;

    const totalExpected = results.reduce((s, r) => s + r.expectedAmount, 0);
    const totalActual = results.reduce((s, r) => s + r.actualAmount, 0);
    const totalExcelRows = results.reduce((s, r) => s + (r.excelGroup?.rows.length || 0), 0);

    return {
        totalExcelRows,
        totalDbGroups: results.filter(r => r.dbGroup !== null).length,
        normal,
        warning,
        error,
        partialRefund,
        cancelled,
        completed,
        excluded,
        totalExpected,
        totalActual,
        totalDiff: totalExpected - totalActual,
    };
}

export async function confirmSettlement(reservationIds: string[]): Promise<{ success: boolean; error?: string }> {
    if (reservationIds.length === 0) return { success: true };

    const { error } = await supabase
        .from('reservations')
        .update({
            settlement_status: 'completed',
            settled_at: new Date().toISOString(),
        })
        .in('id', reservationIds);

    if (error) {
        console.error('Settlement confirmation error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function excludeSettlement(reservationIds: string[]): Promise<{ success: boolean; error?: string }> {
    if (reservationIds.length === 0) return { success: true };

    const { error } = await supabase
        .from('reservations')
        .update({
            settlement_status: 'excluded',
            settled_at: new Date().toISOString(),
        })
        .in('id', reservationIds);

    if (error) {
        console.error('Settlement exclusion error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Fetches "Unsettled Past Reservations" (Carry-over Check).
 * Criteria: 
 * 1. tour_date < currentMinDate
 * 2. settlement_status IS NULL
 * 3. status != '취소'
 */
export async function fetchUnsettledPastReservations(
    sourceCode: string,
    currentMinDate: string
): Promise<MergedReservation[]> {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .ilike('source', sourceCode)
        .lt('tour_date', currentMinDate) // Past dates only
        .neq('status', '취소')
        .is('settlement_status', null); // Unsettled only

    if (error) {
        console.error('fetchUnsettledPastReservations error:', error);
        return [];
    }

    if (!data || data.length === 0) return [];

    // Virtual Merge them for display
    return virtualMerge(data);
}

// ===========================
// Helpers
// ===========================

function parsePaxString(str: string): number {
    const n = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
}

function extractChildCount(text: string): number {
    if (!text) return 0;
    // Regex to match: (아1), (아 1), (아동1), (소아1), (유아1), (Child1), (C1), (baby1)
    // Case insensitive, optional '동', flexible whitespace
    const regex = /(?:아|유|소|child|c|baby)(?:동)?\s*(\d+)/i;
    const match = text.match(regex);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0;
}

function formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    try {
        return format(parseISO(dateStr), 'M/d');
    } catch {
        return dateStr;
    }
}
