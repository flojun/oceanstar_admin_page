const fs = require('fs');
const readline = require('readline');
const path = require('path');

const inputPath = 'c:\\Users\\skyli\\Downloads\\오션스타 예약(원본) - 예약입력 (3).csv';
const outputPath = 'c:\\Users\\skyli\\Downloads\\supabase_import.csv';

function formatDatePattern(dateStr, defaultYear) {
    if (!dateStr) return '';
    // If it already has a year like 2/4/2026
    let parts = dateStr.trim().split('/');
    if (parts.length === 3) {
        let y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        let m = parts[0].padStart(2, '0');
        let d = parts[1].padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    if (parts.length === 2) {
        let m = parts[0].padStart(2, '0');
        let d = parts[1].padStart(2, '0');
        // Heuristic: if month is 7,8,9,10,11,12 probably 2025. if 1,2,3,4,5,6 probably 2026 (for receipt dates)
        let y = parseInt(m) >= 7 ? '2025' : '2026';
        if (defaultYear) y = defaultYear;
        return `${y}-${m}-${d}`;
    }
    return dateStr;
}

function processCSV() {
    const lines = fs.readFileSync(inputPath, 'utf-8').split('\n');
    const records = [];
    let currentReceiptDate = '';

    for (let i = 1; i < lines.length; i++) { // Skip header
        const rawLine = lines[i].replace(/\r/g, '');
        if (!rawLine.trim()) continue;

        // Manually split by comma, respecting quotes if there are any
        const row = [];
        let insideQuote = false;
        let currentValue = "";
        for (let j = 0; j < rawLine.length; j++) {
            const char = rawLine[j];
            if (char === '"') {
                insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
                row.push(currentValue);
                currentValue = "";
            } else {
                currentValue += char;
            }
        }
        row.push(currentValue);

        // Update receipt date if col 0 has it
        let cd = row[0] ? row[0].trim() : '';
        if (cd && cd.match(/^\d{1,2}\/\d{1,2}/)) {
            currentReceiptDate = cd;
        }

        // Left side: [접수일 0, 예약경로 1, 예약자명 2, 여행일 3, 요일 4, 인원수 5, 옵션 6, 픽업 장소 7, 연락처 8]
        if (row[1] && row[2]) {
            records.push({
                receipt_date: formatDatePattern(currentReceiptDate),
                source: row[1] || '',
                name: row[2] || '',
                tour_date: formatDatePattern(row[3]) || '',
                pax: row[5] || '',
                option: row[6] || '',
                pickup_location: row[7] || '',
                contact: row[8] || '',
                status: '예약확정', // Default
                note: ''
            });
        }

        // Right side: starting at col 10 in many cases
        // 10: 예약경로, 11: 예약자명, 12: 여행일, 13: 요일, 14: 인원수, 15: 옵션, 16: 픽업 장소, 17: 안내완/상태
        if (row.length > 11 && row[10] && row[11]) {
            records.push({
                receipt_date: formatDatePattern(currentReceiptDate), // Use same receipt date context
                source: row[10] || '',
                name: row[11] || '',
                tour_date: formatDatePattern(row[12]) || '',
                pax: row[14] || '',
                option: row[15] || '',
                pickup_location: row[16] || '',
                contact: '', // not recorded on right side usually
                status: '예약확정', 
                note: row[17] || '' // often "안내완"
            });
        }
    }

    // Generate CSV string
    const headers = ['receipt_date', 'source', 'name', 'tour_date', 'pax', 'option', 'pickup_location', 'contact', 'status', 'note'];
    let csvString = headers.join(',') + '\n';
    
    for (const r of records) {
        // escape quotes / commas
        const esc = (val) => {
            if (!val) return '';
            let s = val.toString().replace(/"/g, '""');
            if (s.includes(',') || s.includes('\n')) {
                s = `"${s}"`;
            }
            return s;
        };
        csvString += headers.map(h => esc(r[h])).join(',') + '\n';
    }

    fs.writeFileSync(outputPath, csvString, 'utf-8');
    console.log(`Processed ${records.length} records to ${outputPath}`);
}

processCSV();
