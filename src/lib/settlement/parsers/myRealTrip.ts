// MyRealTrip settlement Excel parser
// Groups rows by reservation ID and sums amounts within each group
// Uses exceljs for robust parsing

import ExcelJS from 'exceljs';
import { SettlementRow } from '@/types/settlement';
import { ParseResult } from './index';

export async function parseMyRealTrip(file: File): Promise<ParseResult> {
    const errors: string[] = [];

    try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.worksheets[0];
        if (!sheet) return { rows: [], errors: ['엑셀 파일에 시트가 없습니다.'] };

        // Detect columns from header row (Row 1)
        const headerRow = sheet.getRow(1);
        const col = detectColumns(headerRow);

        // DEBUG: Check column detection
        console.log('[MyRealTrip Parser (ExcelJS)] Detected columns (indices):', JSON.stringify(col, null, 2));

        if (!col.reservationId) {
            // Get header values for error message
            const headers: string[] = [];
            headerRow.eachCell((cell) => {
                headers.push(String(cell.value));
            });
            errors.push(`예약번호 컬럼을 찾을 수 없습니다. 감지된 컬럼: ${headers.join(', ')}`);
        }

        // Parse all raw rows
        const rawRows: Array<{
            reservationId: string;
            productName: string;
            tourDate: string;
            receiptDate?: string; // Added receiptDate
            adultCount: number;
            childCount: number;
            amount: number;
            customerName: string;
            option: string;
            raw: Record<string, unknown>;
        }> = [];

        // Iterate starting from row 2
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            try {
                const getVal = (colIdx: number) => {
                    if (!colIdx) return '';
                    const cell = row.getCell(colIdx);
                    // ExcelJS value can be object (hyperlink, formula) or primitive
                    if (cell.value && typeof cell.value === 'object' && 'text' in cell.value) {
                        return (cell.value as any).text;
                    }
                    return cell.value;
                };

                const reservationId = String(getVal(col.reservationId) || '').trim();
                const productName = String(getVal(col.productName) || '').trim();
                let tourDate = parseDateValue(getVal(col.tourDate));

                // Fallback: Extract Receipt Date from Reservation ID (EXP-20251225-...)
                let receiptDate = '';
                if (reservationId.startsWith('EXP-')) {
                    const match = reservationId.match(/EXP-(\d{8})-/);
                    if (match) {
                        const d = match[1];
                        receiptDate = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
                        // Removed fallback: if (!tourDate) tourDate = receiptDate;
                    }
                }

                const adultCount = parseNumeric(getVal(col.adultCount));
                const childCount = parseNumeric(getVal(col.childCount));
                const amount = parseNumeric(getVal(col.amount));
                const customerName = String(getVal(col.customerName) || '').trim();
                let option = String(getVal(col.option) || '').trim();

                // Sanitize Option: If it looks like a full product name (too long), try to extract simplified option
                // or if it's empty, try to extract from ProductName
                const isLongOption = option.length > 15;
                const shouldExtract = !option || isLongOption;

                if (shouldExtract) {
                    const sourceText = isLongOption ? option : productName;
                    // Extract patterns:
                    // - Times: 1부, 2부, 09:00, 13:00
                    // - Combined: 1/2부, 1부/2부
                    // - Product Keywords: 거북이, 스노클링, 다이빙, 패러세일링, 제트스키, 선셋
                    const match = sourceText.match(/([0-9]{1,2}\/?[0-9]{1,2}부|[0-9]{2}:[0-9]{2}|선셋|패러세일링|제트스키|거북이|스노클링|다이빙)/);
                    if (match) {
                        option = match[0];
                    } else if (isLongOption) {
                        // If long and no keyword found, it's likely garbage/product name. Clear it.
                        option = '';
                    }
                }

                const raw: Record<string, unknown> = {};

                if (!reservationId && !customerName) return;

                rawRows.push({ reservationId, productName, tourDate, receiptDate, adultCount, childCount, amount, customerName, option, raw });
            } catch (e) {
                errors.push(`행 ${rowNumber}: ${e instanceof Error ? e.message : String(e)}`);
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
            const options = [...new Set(group.map(r => r.option).filter(Boolean))];

            rows.push({
                reservationId: first.reservationId,
                productName: productNames.join(' + '),
                tourDate: first.tourDate,
                receiptDate: first.receiptDate, // Added receiptDate
                option: options.join(' + '),    // Added options
                pax: totalAdult + totalChild,
                adultCount: totalAdult,
                childCount: totalChild,
                platformAmount: totalAmount,
                customerName: first.customerName,
                rawData: first.raw,
                status: '전처리완료',
            });
        });

        return { rows, errors };
    } catch (e) {
        return { rows: [], errors: [`파일 읽기 실패(ExcelJS): ${e instanceof Error ? e.message : String(e)}`] };
    }
}

// ---- Column detection ----

interface ColumnMapping {
    reservationId: number; // Index (1-based)
    productName: number;
    tourDate: number;
    adultCount: number;
    childCount: number;
    amount: number;
    customerName: number;
    option: number; // Added option
}

const PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
    reservationId: [/예약번호/i, /예약.?id/i, /reservation/i, /booking.?id/i, /주문번호/i],
    productName: [/^상품명$/i, /product name/i, /투어명/i],
    tourDate: [/여행일/i, /투어일/i, /tour.?date/i, /이용일/i, /날짜/i, /사용일/i, /탑승일/i, /출국일/i, /입국일/i],
    adultCount: [/성인/i, /adult/i, /대인/i],
    childCount: [/아동/i, /child/i, /소인/i, /어린이/i],
    amount: [/판매금액/i, /sales.?amount/i, /총.?판매금액/i, /결제금액/i],
    customerName: [/예약자/i, /이름/i, /customer/i, /고객명/i, /성명/i],
    option: [/옵션/i, /option/i, /선택정보/i, /선택 정보/i, /선택/i],
};

function detectColumns(headerRow: ExcelJS.Row): ColumnMapping {
    const mapping: Partial<ColumnMapping> = {};

    headerRow.eachCell((cell, colNumber) => {
        const value = String(cell.value || '');
        for (const [field, patterns] of Object.entries(PATTERNS)) {
            if (mapping[field as keyof ColumnMapping]) continue; // already found

            if (patterns.some(p => p.test(value))) {
                mapping[field as keyof ColumnMapping] = colNumber;
            }
        }
    });

    // Fill missing with 0
    for (const key of Object.keys(PATTERNS)) {
        if (!mapping[key as keyof ColumnMapping]) {
            mapping[key as keyof ColumnMapping] = 0;
        }
    }

    return mapping as ColumnMapping;
}

function parseNumeric(value: unknown): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Handle rich text
    const str = (value && typeof value === 'object' && 'text' in value) ? (value as any).text : String(value);

    const cleaned = str.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function parseDateValue(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) {
        return value.toISOString().substring(0, 10);
    }
    // Handle rich text
    const str = (value && typeof value === 'object' && 'text' in value) ? (value as any).text : String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
    // YYYY.MM.DD or YYYY/MM/DD
    const m1 = str.match(/^(\d{4})[\/.\\-](\d{1,2})[\/.\\-](\d{1,2})/);
    if (m1) return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;
    // MM/DD/YYYY or MM.DD.YYYY
    const m2 = str.match(/^(\d{1,2})[\/.\\-](\d{1,2})[\/.\\-](\d{4})/);
    if (m2) return `${m2[3]}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`;
    return str;
}
