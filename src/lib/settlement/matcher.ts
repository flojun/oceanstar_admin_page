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
} from '@/types/settlement';

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
    endDate?: string
): Promise<MergedReservation[]> {
    let query = supabase
        .from('reservations')
        .select('*')
        .ilike('source', sourceCode)
        .neq('status', '취소');

    if (startDate) query = query.gte('tour_date', startDate);
    if (endDate) query = query.lte('tour_date', endDate);

    const { data, error } = await query;
    if (error) {
        console.error('reservations fetch error:', error);
        return [];
    }

    return virtualMerge(data || []);
}

/**
 * Virtual Merge: group by name + receipt_date, merge options, extract children
 */
function virtualMerge(rows: Record<string, unknown>[]): MergedReservation[] {
    const groups = new Map<string, Record<string, unknown>[]>();

    rows.forEach(r => {
        const name = String(r.name || '').trim();
        const receiptDate = String(r.receipt_date || '').trim();
        const key = `${name}|${receiptDate}`;

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
    });

    const merged: MergedReservation[] = [];

    groups.forEach((group, key) => {
        const first = group[0];

        // Merge options → tags
        const options = group
            .map(r => String(r.option || '').trim())
            .filter(Boolean);
        const uniqueOptions = [...new Set(options)];

        // Sum pax
        const totalPax = group.reduce((sum, r) => {
            return sum + parsePaxString(String(r.pax || ''));
        }, 0);

        // Extract children from note / pickup_location
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

/**
 * Extract child count from note/pickup text using 아(\d+) pattern
 */
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

// ===========================
// 4. Tag-Based Precision Classifier
// ===========================

interface ClassifierResult {
    productName: string;
    matchedProduct: ProductPrice | null;
    isAnomaly: boolean;
    notes: string[];
}

/**
 * Extract option tags from merged options array.
 * Tags are normalized lowercase presence flags.
 */
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

/**
 * Find a product_price row by match_keywords.
 * Keywords are comma-separated. A keyword like "1부+패러" must be checked
 * via tag combinations, not substring inclusion.
 */
function findProductByName(productPrices: ProductPrice[], nameSubstring: string): ProductPrice | null {
    return productPrices.find(p =>
        p.product_name.includes(nameSubstring)
    ) || null;
}

/**
 * Tag-Based Precision Classifier with priority rules.
 *
 * Priority (highest first):
 * 1. [콤보] 거북이 + 패러: (1부 OR 2부) AND 패러
 * 2. [콤보] 거북이 + 제트: (1부 OR 2부) AND 제트
 * 3. [액티비티] 패러 + 제트: 패러 AND 제트
 * 4. [단품] 거북이(1/2부): (1부 OR 2부) only (no 패러/제트)
 * 5. [단품] 선셋(3부): (3부 OR 선셋)
 * 6. [단품] 패러 or 제트: 패러 only OR 제트 only
 *
 * Anomaly: 1부 + 패러 + 제트 → 3종 결합 (존재하지 않는 상품)
 */
export function classifyProduct(
    options: string[],
    productPrices: ProductPrice[]
): ClassifierResult {
    const tags = extractTags(options);
    const hasTurtle = tags.has1bu || tags.has2bu;
    const hasSunset = tags.has3bu || tags.hasSunset;
    const notes: string[] = [];

    // ---- Anomaly Detection: 3종 결합 ----
    if (hasTurtle && tags.hasParasail && tags.hasJetski) {
        notes.push('🟡 [알 수 없는 조합] 거북이+패러+제트 3종 결합은 존재하지 않는 상품입니다.');
        // Fallback: use the highest-priced combo available
        const combo1 = findProductByName(productPrices, '거북이 + 패러');
        const combo2 = findProductByName(productPrices, '패러 + 제트');
        // Pick the more expensive one
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

    // ---- Priority 1: [콤보] 거북이 + 패러 ----
    if (hasTurtle && tags.hasParasail) {
        const product = findProductByName(productPrices, '거북이 + 패러');
        return {
            productName: product?.product_name || '[콤보] 거북이 + 패러',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // ---- Priority 2: [콤보] 거북이 + 제트 ----
    if (hasTurtle && tags.hasJetski) {
        const product = findProductByName(productPrices, '거북이 + 제트');
        return {
            productName: product?.product_name || '[콤보] 거북이 + 제트',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // ---- Priority 3: [액티비티] 패러 + 제트 ----
    if (tags.hasParasail && tags.hasJetski) {
        const product = findProductByName(productPrices, '패러 + 제트');
        return {
            productName: product?.product_name || '[액티비티] 패러 + 제트',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // ---- Priority 4: [단품] 거북이 스노클링(1/2부) ----
    if (hasTurtle && !tags.hasParasail && !tags.hasJetski) {
        const product = findProductByName(productPrices, '거북이 스노클링');
        return {
            productName: product?.product_name || '거북이 스노클링(1/2부)',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // ---- Priority 5: [단품] 선셋(3부) ----
    if (hasSunset) {
        const product = findProductByName(productPrices, '선셋');
        return {
            productName: product?.product_name || '선셋 스노클링(3부)',
            matchedProduct: product,
            isAnomaly: false,
            notes,
        };
    }

    // ---- Priority 6: [단품] 패러세일링 or 제트스키 ----
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

    // ---- No match ----
    notes.push('매칭되는 기준가 상품이 없습니다.');
    return {
        productName: '(미분류)',
        matchedProduct: null,
        isAnomaly: false,
        notes,
    };
}

// ===========================
// 5. Main matching: Excel vs DB
// ===========================

export function matchSettlementData(
    excelRows: SettlementRow[],
    dbGroups: MergedReservation[],
    productPrices: ProductPrice[]
): MatchResult[] {
    const results: MatchResult[] = [];
    const matchedDbKeys = new Set<string>();

    for (const excelRow of excelRows) {
        // Find matching DB group by name + tour date
        let bestMatch: MergedReservation | null = null;

        for (const dbg of dbGroups) {
            if (matchedDbKeys.has(dbg.groupKey)) continue;

            const dbName = dbg.name.toLowerCase().trim();
            const excelName = excelRow.customerName.toLowerCase().trim();

            const nameMatch = dbName && excelName &&
                (dbName.includes(excelName) || excelName.includes(dbName));
            const dateMatch = dbg.tourDate === excelRow.tourDate;

            if (nameMatch && dateMatch) {
                bestMatch = dbg;
                break;
            }
        }

        // Fallback: date + pax match
        if (!bestMatch) {
            for (const dbg of dbGroups) {
                if (matchedDbKeys.has(dbg.groupKey)) continue;
                if (dbg.tourDate === excelRow.tourDate && dbg.totalPax === excelRow.pax) {
                    bestMatch = dbg;
                    break;
                }
            }
        }

        if (bestMatch) {
            matchedDbKeys.add(bestMatch.groupKey);

            // --- Precision Classifier ---
            const classified = classifyProduct(bestMatch.originalOptions, productPrices);
            const matchedProduct = classified.matchedProduct;

            // Calculate expected amount
            let expectedAmount = 0;
            if (matchedProduct) {
                expectedAmount =
                    (bestMatch.adultCount * matchedProduct.adult_price) +
                    (bestMatch.childCount * matchedProduct.child_price);
            }

            const actualAmount = excelRow.platformAmount;
            const amountDiff = expectedAmount - actualAmount;
            const diffPercent = expectedAmount > 0 ? Math.abs(amountDiff / expectedAmount) * 100 : 0;

            // Status judgment
            let status: MatchStatus;
            let statusLabel: string;
            const notes: string[] = [...classified.notes];

            if (classified.isAnomaly) {
                status = 'warning';
                statusLabel = '확인필요';
            } else if (expectedAmount === 0 || !matchedProduct) {
                status = 'warning';
                statusLabel = '확인필요';
                if (!notes.some(n => n.includes('매칭'))) {
                    notes.push('매칭되는 기준가 상품이 없습니다.');
                }
            } else if (diffPercent <= 10) {
                status = 'normal';
                statusLabel = '정상';
                if (amountDiff !== 0) {
                    notes.push(`오차 ${diffPercent.toFixed(1)}% (허용 범위 내)`);
                }
            } else {
                status = 'warning';
                statusLabel = '확인필요';

                // --- 금액 부족 감지: 콤보 판별인데 단품 수준 금액 ---
                if (matchedProduct && matchedProduct.tier_group === 'Tier 3' && amountDiff > 0) {
                    // Find the cheapest single-product price (Tier 1)
                    const tier1Products = productPrices.filter(p => p.tier_group === 'Tier 1' && p.is_active);
                    const lowestSinglePrice = tier1Products.length > 0
                        ? Math.min(...tier1Products.map(p => p.adult_price))
                        : 0;

                    if (lowestSinglePrice > 0 && actualAmount <= lowestSinglePrice * bestMatch.totalPax * 1.15) {
                        notes.push(`🟡 [금액 부족] 콤보(${classified.productName}) 판별인데 정산금이 단품 수준입니다.`);
                    } else {
                        notes.push(`금액 오차 ${diffPercent.toFixed(1)}% (±10% 초과)`);
                    }
                } else {
                    notes.push(`금액 오차 ${diffPercent.toFixed(1)}% (±10% 초과)`);
                }
            }

            results.push({
                status,
                statusLabel,
                classifiedProductName: classified.productName,
                excelRow,
                dbGroup: bestMatch,
                matchedProduct,
                expectedAmount,
                actualAmount,
                amountDiff,
                diffPercent,
                notes,
            });
        } else {
            // No DB match found
            results.push({
                status: 'error',
                statusLabel: '오류',
                classifiedProductName: '(DB 없음)',
                excelRow,
                dbGroup: null,
                matchedProduct: null,
                expectedAmount: 0,
                actualAmount: excelRow.platformAmount,
                amountDiff: -excelRow.platformAmount,
                diffPercent: 100,
                notes: ['DB에 매칭되는 예약을 찾을 수 없습니다.'],
            });
        }
    }

    // DB groups not matched by any Excel row
    for (const dbg of dbGroups) {
        if (!matchedDbKeys.has(dbg.groupKey)) {
            const classified = classifyProduct(dbg.originalOptions, productPrices);
            let expectedAmount = 0;
            if (classified.matchedProduct) {
                expectedAmount =
                    (dbg.adultCount * classified.matchedProduct.adult_price) +
                    (dbg.childCount * classified.matchedProduct.child_price);
            }

            results.push({
                status: 'error',
                statusLabel: '오류',
                classifiedProductName: classified.productName,
                excelRow: null,
                dbGroup: dbg,
                matchedProduct: classified.matchedProduct,
                expectedAmount,
                actualAmount: 0,
                amountDiff: expectedAmount,
                diffPercent: 100,
                notes: ['플랫폼 엑셀에 없는 DB 예약입니다.', ...classified.notes],
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

    const totalExpected = results.reduce((s, r) => s + r.expectedAmount, 0);
    const totalActual = results.reduce((s, r) => s + r.actualAmount, 0);

    return {
        totalExcelRows: results.filter(r => r.excelRow !== null).length,
        totalDbGroups: results.filter(r => r.dbGroup !== null).length,
        normal,
        warning,
        error,
        totalExpected,
        totalActual,
        totalDiff: totalExpected - totalActual,
    };
}

// ===========================
// 7. Settlement Confirmation
// ===========================

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
