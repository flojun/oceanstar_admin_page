// Settlement matcher engine
// Virtual merge, tag-based precision classifier, ±10% validation

import { supabase } from '@/lib/supabase';
import {
    SettlementRow,
    MergedReservation,
    MatchResult,
    MatchStatus,
    ProductPrice,
    SettlementSummary,
    ExcelGroup,
} from '@/types/settlement';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';

// ===========================
// 0. Excel Grouping (Double Aggregation)
// ===========================

// Helper to normalize pickup location (remove parens and content, remove spaces)
function normalizePickup(pickup: string): string {
    return pickup.replace(/\(.*\)/g, '').replace(/\s+/g, '').trim();
}

function groupExcelRows(rows: SettlementRow[]): ExcelGroup[] {
    // 1. Sort: Name ASC -> Date ASC (Amount sort removed)
    const sorted = [...rows].sort((a, b) => {
        const nameA = a.customerName.replace(/\s+/g, '');
        const nameB = b.customerName.replace(/\s+/g, '');
        if (nameA !== nameB) return nameA.localeCompare(nameB);
        return a.tourDate.localeCompare(b.tourDate);
    });

    const groups: ExcelGroup[] = [];

    // 2. Grouping
    for (const row of sorted) {
        const lastGroup = groups[groups.length - 1];

        let shouldMerge = false;
        if (lastGroup) {
            const normName = row.customerName.replace(/\s+/g, '').toLowerCase();
            const lastNormName = lastGroup.customerName.replace(/\s+/g, '').toLowerCase();

            // Criteria: Same Name + Date within 1 day based on Receipt Date
            const lastRow = lastGroup.rows[lastGroup.rows.length - 1];
            const diff = Math.abs(differenceInCalendarDays(parseISO(row.tourDate), parseISO(lastRow.tourDate)));

            if (normName === lastNormName &&
                diff <= 1
            ) {
                shouldMerge = true;
            }
        }

        if (shouldMerge) {
            // Merge into last group
            lastGroup.rows.push(row);
            lastGroup.totalAmount += row.platformAmount;
            lastGroup.totalPax += row.pax;
            lastGroup.adultCount += row.adultCount;
            lastGroup.childCount += row.childCount;
        } else {
            // New Group
            groups.push({
                groupId: `${row.customerName}|${row.tourDate}|${Math.random()}`,
                customerName: row.customerName,
                tourDate: row.tourDate, // Earliest
                totalAmount: row.platformAmount,
                totalPax: row.pax,
                adultCount: row.adultCount,
                childCount: row.childCount,
                rows: [row],
                isPartialRefund: false,
                isFullCancellation: false,
            });
        }
    }

    // 3. Refund Detection
    for (const group of groups) {
        const hasNegativeRow = group.rows.some(r => r.platformAmount < 0);

        if (group.totalAmount <= 0) {
            group.isFullCancellation = true;
        } else if (hasNegativeRow) {
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
 * Virtual Merge: group by name + receipt_date + NORMALIZED PICKUP
 */
function virtualMerge(rows: Record<string, unknown>[]): MergedReservation[] {
    const groups = new Map<string, Record<string, unknown>[]>();

    rows.forEach(r => {
        const name = String(r.name || '').trim();
        const receiptDate = String(r.receipt_date || '').trim();
        // 1. Pickup Normalization: Distinct groups for different pickup locations
        const pickup = normalizePickup(String(r.pickup_location || ''));

        // Key includes pickup to separate same-name same-day different-hotel
        const key = `${name}|${receiptDate}|${pickup}`;

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
    });

    const merged: MergedReservation[] = [];

    groups.forEach((group, key) => {
        const first = group[0];

        const options = group
            .map(r => String(r.option || '').trim())
            .filter(Boolean);
        const uniqueOptions = [...new Set(options)];

        const totalPax = parsePaxString(String(first.pax || ''));

        const allNotes = group.map(r => `${r.note || ''} ${r.pickup_location || ''}`).join(' ');
        const childCount = extractChildCount(allNotes);
        const adultCount = Math.max(0, totalPax - childCount);

        merged.push({
            groupKey: key,
            name: String(first.name || ''),
            receiptDate: String(first.receipt_date || ''),
            tourDate: String(first.tour_date || ''),
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
        });
    });

    return merged;
}

// ===========================
// 3. Helpers
// ===========================

function parsePaxString(pax: string): number {
    if (!pax) return 0;
    const num = parseInt(pax.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

function extractChildCount(text: string): number {
    if (!text) return 0;
    const matches = text.match(/아\s*(\d+)/g);
    if (!matches) return 0;

    let total = 0;
    matches.forEach(m => {
        const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) total += num;
    });
    return total;
}

function formatDateShort(dateStr: string): string {
    try {
        return format(parseISO(dateStr), 'M/d');
    } catch {
        return dateStr;
    }
}

// ===========================
// 4. Tag-Based Precision Classifier
// ===========================

interface ClassifierResult {
    productName: string;
    matchedProduct: ProductPrice | null;
    isAnomaly: boolean;
    notes: string[];
}

function extractTags(options: string[]): {
    has1bu: boolean;
    has2bu: boolean;
    has3bu: boolean;
    hasSunset: boolean;
    hasParasail: boolean;
    hasJetski: boolean;
} {
    const joined = options.map(o => o.toLowerCase()).join(' ');
    return {
        has1bu: joined.includes('1부'),
        has2bu: joined.includes('2부'),
        has3bu: joined.includes('3부'),
        hasSunset: joined.includes('선셋'),
        hasParasail: joined.includes('패러'),
        hasJetski: joined.includes('제트'),
    };
}

function findProductByName(productPrices: ProductPrice[], nameSubstring: string): ProductPrice | null {
    return productPrices.find(p =>
        p.product_name.includes(nameSubstring)
    ) || null;
}

export function classifyProduct(
    options: string[],
    productPrices: ProductPrice[]
): ClassifierResult {
    const tags = extractTags(options);
    const hasTurtle = tags.has1bu || tags.has2bu;
    const hasSunset = tags.has3bu || tags.hasSunset;
    const notes: string[] = [];

    // Same priority rules as before...
    if (hasTurtle && tags.hasParasail && tags.hasJetski) {
        notes.push('🟡 [알 수 없는 조합] 거북이+패러+제트 3종 결합은 존재하지 않는 상품입니다.');
        const combo1 = findProductByName(productPrices, '거북이 + 패러');
        const combo2 = findProductByName(productPrices, '패러 + 제트');
        let fallback = combo1;
        if (combo2 && (!fallback || combo2.adult_price > fallback.adult_price)) {
            fallback = combo2;
        }
        return {
            productName: fallback?.product_name || '[알 수 없는 조합]',
            matchedProduct: fallback,
            isAnomaly: true,
            notes,
        };
    }

    if (hasTurtle && tags.hasParasail) {
        const product = findProductByName(productPrices, '거북이 + 패러');
        return {
            productName: product?.product_name || '[콤보] 거북이 + 패러',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    if (hasTurtle && tags.hasJetski) {
        const product = findProductByName(productPrices, '거북이 + 제트');
        return {
            productName: product?.product_name || '[콤보] 거북이 + 제트',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    if (tags.hasParasail && tags.hasJetski) {
        const product = findProductByName(productPrices, '패러 + 제트');
        return {
            productName: product?.product_name || '[액티비티] 패러 + 제트',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    if (hasTurtle && !tags.hasParasail && !tags.hasJetski) {
        const product = findProductByName(productPrices, '거북이 스노클링');
        return {
            productName: product?.product_name || '거북이 스노클링(1/2부)',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    if (hasSunset) {
        const product = findProductByName(productPrices, '선셋');
        return {
            productName: product?.product_name || '선셋 스노클링(3부)',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    if (tags.hasParasail && !tags.hasJetski) {
        const product = findProductByName(productPrices, '패러세일링');
        return {
            productName: product?.product_name || '패러세일링(단품)',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    if (tags.hasJetski && !tags.hasParasail) {
        const product = findProductByName(productPrices, '제트스키');
        return {
            productName: product?.product_name || '제트스키(단품)',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    notes.push('매칭되는 기준가 상품이 없습니다.');
    return {
        productName: '(미분류)',
        matchedProduct: null,
        isAnomaly: false,
        notes,
    };
}

// ===========================
// 5. Match Logic (Group vs Group)
// ===========================

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
            results.push({
                status: 'cancelled',
                statusLabel: '취소',
                classifiedProductName: '-',
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

        for (const dbg of dbGroups) {
            if (matchedDbKeys.has(dbg.groupKey)) continue;

            const dbName = dbg.name.replace(/\s+/g, '').toLowerCase();
            const exName = exGroup.customerName.replace(/\s+/g, '').toLowerCase();
            const nameMatch = dbName && exName && (dbName.includes(exName) || exName.includes(dbName));

            // Receipt Date matching for Source 'M' and others
            let dbDateStr = dbg.tourDate;
            if (dbg.source === 'M') dbDateStr = dbg.receiptDate;

            const exactDateMatch = dbDateStr === exGroup.tourDate;
            let toleranceMatch = false;

            if (!exactDateMatch && nameMatch) {
                const diff = Math.abs(differenceInCalendarDays(parseISO(dbDateStr), parseISO(exGroup.tourDate)));
                if (diff <= 1) toleranceMatch = true;
            }

            if (nameMatch) {
                if (exactDateMatch) {
                    bestMatch = dbg;
                    dateMismatchWarning = null;
                    break;
                }
                if (toleranceMatch && !bestMatch) {
                    bestMatch = dbg;
                    dateMismatchWarning = `⚠️ 접수일 불일치 (엑셀: ${formatDateShort(exGroup.tourDate)} vs DB: ${formatDateShort(dbDateStr)})`;
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

            // --- Status Determination ---
            if (exGroup.isPartialRefund) {
                status = 'partial_refund';
                statusLabel = '부분환불';
                notes.push('부분 환불 내역이 포함되어 있습니다.');
            } else if (expectedAmount > 0 && diffAbs > errorMargin) {
                // Initial Warning
                status = 'warning';
                statusLabel = '확인필요';

                // ---- Exception Handling: On-site Payment ----
                // Check if Amount is less than expected (diff < 0) AND triggers exist
                const dbNotesFn = (bestMatch.note + ' ' + bestMatch.pickupLocation).toLowerCase();
                const hasTrigger = dbNotesFn.includes('추가') || dbNotesFn.includes('$');

                if (diff < 0 && hasTrigger && classified.matchedProduct) {
                    // Recalculate: Treat ALL Pax as Children (Base price paid on platform)
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
            results.push({
                status: 'error',
                statusLabel: 'DB없음',
                classifiedProductName: '-',
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

    return results;
}

// ===========================
// 6. Summary
// ===========================

export function calculateSummary(results: MatchResult[]): SettlementSummary {
    const normal = results.filter(r => r.status === 'normal').length;
    const warning = results.filter(r => r.status === 'warning').length;
    const error = results.filter(r => r.status === 'error').length;
    const partialRefund = results.filter(r => r.status === 'partial_refund').length;
    const cancelled = results.filter(r => r.status === 'cancelled').length;

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
        totalExpected,
        totalActual,
        totalDiff: totalExpected - totalActual,
    };
}

export async function confirmSettlement(reservationIds: string[]): Promise<{ success: boolean; error?: string }> {
    if (reservationIds.length === 0) return { success: true };

    const { error } = await supabase
        .from('reservations')
        .update({ status: '정산완료' })
        .in('id', reservationIds);

    if (error) {
        console.error('Settlement confirmation error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
