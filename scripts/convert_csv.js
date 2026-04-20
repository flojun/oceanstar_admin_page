const fs = require('fs');

const inputPath = 'c:\\Users\\skyli\\Downloads\\오션스타 예약(원본) - 예약입력 (3).csv';
const outputPath = 'c:\\Users\\skyli\\Downloads\\supabase_import_strict_order.csv';

function formatDatePattern(dateStr, defaultYear) {
    if (!dateStr) return '';
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

    // A열부터 I열까지 (index 0~8)만 사용 및 행 순서 절대 유지
    let baseTime = new Date('2024-01-01T00:00:00.000Z').getTime();

    for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i].replace(/\r/g, '');
        if (!rawLine.trim()) continue;

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

        // Only process left side (A~I), index 1 (source) and 2 (name) should exist or we skip empty rows
        if (row[1] || row[2] || row[3]) {
            baseTime += 1000; // Increment 1 second per row to strictly preserve order
            
            records.push({
                created_at: new Date(baseTime).toISOString(),
                receipt_date: formatDatePattern(currentReceiptDate),
                source: row[1] ? row[1].trim() : '',
                name: row[2] ? row[2].trim() : '',
                tour_date: row[3] ? formatDatePattern(row[3]) : '',
                pax: row[5] ? row[5].trim() : '', // index 4 is 요일 (Day of Week), skip
                option: row[6] ? row[6].trim() : '',
                pickup_location: row[7] ? row[7].trim() : '',
                contact: row[8] ? row[8].trim() : '',
                status: '예약확정',
                note: ''
            });
        }
    }

    const headers = ['created_at', 'receipt_date', 'source', 'name', 'tour_date', 'pax', 'option', 'pickup_location', 'contact', 'status', 'note'];
    let csvString = headers.join(',') + '\n';
    
    for (const r of records) {
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
    console.log(`Successfully strictly ordered and processed ${records.length} records to ${outputPath}`);
}

processCSV();
