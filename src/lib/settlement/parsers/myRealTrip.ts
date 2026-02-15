// MyRealTrip settlement Excel parser
// Groups rows by reservation ID and sums amounts within each group

import * as XLSX from 'xlsx';
import { SettlementRow } from '@/types/settlement';
import { ParseResult } from './index';

export async function parseMyRealTrip(file: File): Promise<ParseResult> {
    const errors: string[] = [];

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return { rows: [], errors: ['엑셀 파일에 시트가 없습니다.'] };

        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        if (jsonData.length === 0) return { rows: [], errors: ['엑셀 파일에 데이터가 없습니다.'] };

        // Detect columns from header keys
        const keys = Object.keys(jsonData[0]);
        const col = detectColumns(keys);

        if (!col.reservationId) {
            errors.push(`예약번호 컬럼을 찾을 수 없습니다. 감지된 컬럼: ${keys.join(', ')}`);
        }

        // Parse all raw rows
        const rawRows: Array<{
            reservationId: string;
            productName: string;
            tourDate: string;
            adultCount: number;
            childCount: number;
            amount: number;
            customerName: string;
            raw: Record<string, unknown>;
        }> = [];

        jsonData.forEach((row, idx) => {
            try {
                const reservationId = String(row[col.reservationId] || '').trim();
                const productName = String(row[col.productName] || '').trim();
                const tourDate = parseDateValue(row[col.tourDate]);
                const adultCount = parseNumeric(row[col.adultCount]);
                const childCount = parseNumeric(row[col.childCount]);
                const amount = parseNumeric(row[col.amount]);
                const customerName = String(row[col.customerName] || '').trim();

                if (!reservationId && !customerName) return; // skip empty

                rawRows.push({ reservationId, productName, tourDate, adultCount, childCount, amount, customerName, raw: row });
            } catch (e) {
                errors.push(`행 ${idx + 2}: ${e instanceof Error ? e.message : String(e)}`);
            }
        });

        // Group by reservation ID and sum amounts
        const grouped = new Map<string, typeof rawRows>();
        rawRows.forEach(r => {
            const key = r.reservationId || `anon_${r.customerName}_${r.tourDate}`;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(r);
        });

        const rows: SettlementRow[] = [];
        grouped.forEach((group, _key) => {
            const first = group[0];
            const totalAmount = group.reduce((sum, r) => sum + r.amount, 0);
            const totalAdult = group.reduce((sum, r) => sum + r.adultCount, 0);
            const totalChild = group.reduce((sum, r) => sum + r.childCount, 0);
            const productNames = [...new Set(group.map(r => r.productName).filter(Boolean))];

            rows.push({
                reservationId: first.reservationId,
                productName: productNames.join(' + '),
                tourDate: first.tourDate,
                pax: totalAdult + totalChild,
                adultCount: totalAdult,
                childCount: totalChild,
                platformAmount: totalAmount,
                customerName: first.customerName,
                rawData: first.raw,
            });
        });

        return { rows, errors };
    } catch (e) {
        return { rows: [], errors: [`파일 읽기 실패: ${e instanceof Error ? e.message : String(e)}`] };
    }
}

// ---- Column detection ----

interface ColumnMapping {
    reservationId: string;
    productName: string;
    tourDate: string;
    adultCount: string;
    childCount: string;
    amount: string;
    customerName: string;
}

const PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
    reservationId: [/예약번호/i, /예약.?id/i, /reservation/i, /booking.?id/i, /주문번호/i],
    productName: [/상품명/i, /product/i, /상품/i, /투어명/i],
    tourDate: [/여행일/i, /투어일/i, /tour.?date/i, /이용일/i, /날짜/i],
    adultCount: [/성인/i, /adult/i, /대인/i],
    childCount: [/아동/i, /child/i, /소인/i, /어린이/i],
    amount: [/결제금액/i, /금액/i, /amount/i, /정산금액/i, /총.?금액/i, /판매금액/i],
    customerName: [/예약자/i, /이름/i, /customer/i, /고객명/i, /성명/i],
};

function detectColumns(keys: string[]): ColumnMapping {
    const mapping: Partial<ColumnMapping> = {};
    for (const [field, patterns] of Object.entries(PATTERNS)) {
        for (const key of keys) {
            if (patterns.some(p => p.test(key))) {
                mapping[field as keyof ColumnMapping] = key;
                break;
            }
        }
        if (!mapping[field as keyof ColumnMapping]) {
            mapping[field as keyof ColumnMapping] = '';
        }
    }
    return mapping as ColumnMapping;
}

function parseNumeric(value: unknown): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function parseDateValue(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'number') {
        const d = XLSX.SSF.parse_date_code(value);
        if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
    const m1 = str.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})/);
    if (m1) return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;
    const m2 = str.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
    if (m2) return `${m2[3]}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`;
    return str;
}
