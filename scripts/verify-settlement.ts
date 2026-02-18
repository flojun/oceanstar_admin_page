
import { matchSettlementData, normalizePickup, classifyProduct } from '../src/lib/settlement/matcher';
import { SettlementRow, MergedReservation, MatchResult, ProductPrice } from '../src/types/settlement';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';

// Minimal mock functions for matcher dependencies if needed, but we import matcher directly.
// Need to mock ProductPrice interface fully?
const mockProductPrice: ProductPrice = {
    id: '1',
    product_name: '거북이 스노클링',
    match_keywords: 'turtle',
    adult_price: 100,
    child_price: 50,
    tier_group: 'Tier 1',
    is_active: true
};

const mockSettlementRow = (override: Partial<SettlementRow>): SettlementRow => ({
    reservationId: 'row1',
    productName: 'Turtle',
    tourDate: '2026-02-08',
    pax: 2,
    adultCount: 2,
    childCount: 0,
    platformAmount: 200,
    customerName: 'John Doe',
    status: 'Confirmed',
    rawData: {},
    option: '', // Added default empty option
    ...override
});

const mockMergedReservation = (override: Partial<MergedReservation>): MergedReservation => ({
    groupKey: 'key1',
    name: 'John Doe',
    receiptDate: '2026-01-01',
    tourDate: '2026-02-08',
    mergedOption: 'Turtle 1부',
    originalOptions: ['Turtle', '1부'],
    totalPax: 2,
    adultCount: 2,
    childCount: 0,
    reservationIds: ['id1'],
    source: 'M',
    status: 'Confirmed',
    contact: '123',
    note: '',
    pickupLocation: 'Hotel',
    ...override
});

async function runTests() {
    console.log('--- Starting Settlement Logic Verification ---');

    console.log('\n[Test 1] Date Override Logic (Implicit via VirtualMerge Simulation)');
    // We assume virtualMerge has done its job and put the correct date in tourDate.
    // Matching logic relies on tourDate.

    // Scenario: Excel says Feb 8. DB (original Feb 6) but overridden to Feb 8 in virtualMerge.
    const dbRow1 = mockMergedReservation({ tourDate: '2026-02-08', note: '(2/8)' });
    const excelRow1 = mockSettlementRow({ tourDate: '2026-02-08', customerName: 'John Doe' });

    const result1 = matchSettlementData([excelRow1], [dbRow1], [mockProductPrice]);
    const pass1 = result1.length > 0 && result1[0].status === 'normal';
    console.log('Result 1 (Exact Match with Override):', pass1 ? 'PASS' : 'FAIL', result1[0]?.statusLabel || 'No Match');

    // Test 2: Pickup Normalization (Unit Test)
    console.log('\n[Test 2] Pickup Normalization Function');
    const p1 = normalizePickup('Hotel (Lobby)');
    const p2 = normalizePickup('Hotel');
    const pass2 = p1 === 'Hotel' && p2 === 'Hotel';
    console.log(`'Hotel (Lobby)' -> '${p1}'`);
    console.log(`'Hotel' -> '${p2}'`);
    console.log('Result 2:', pass2 ? 'PASS' : 'FAIL');

    // Test 3: On-site Payment Exception
    console.log('\n[Test 3] On-site Payment Exception');
    // Scenario: Excel Amount 100 (Child Price * 2), DB requires 200 (Adult Price * 2). 
    // Difference is -100.
    // DB Note has "add" or "$"
    const dbRow3 = mockMergedReservation({
        adultCount: 2,
        childCount: 0,
        note: '($10 add)',
        pickupLocation: 'Hotel',
        tourDate: '2026-02-08',
        name: 'Jane Doe'
    });
    const excelRow3 = mockSettlementRow({
        customerName: 'Jane Doe',
        adultCount: 0,
        childCount: 2,
        platformAmount: 100, // 2 * 50
        tourDate: '2026-02-08'
    });

    const result3 = matchSettlementData([excelRow3], [dbRow3], [mockProductPrice]);
    const pass3 = result3.length > 0 && result3[0].status === 'normal' && result3[0].statusLabel === '현장결제';
    console.log('Result 3 (On-site Payment):', pass3 ? 'PASS' : 'FAIL', result3[0]?.statusLabel);

    // Test 4: Saturday Carry-over
    console.log('\n[Test 4] Saturday Carry-over');
    // Scenario: DB has a row on Saturday that is NOT matched by any Excel row.
    const dbRow4 = mockMergedReservation({
        groupKey: 'unmatched_sat',
        tourDate: '2026-02-14', // Saturday
        name: 'Saturday User',
        pickupLocation: 'Hotel',
        receiptDate: '2026-02-01'
    });

    // We pass empty Excel rows to force unmatched dbRow4
    const result4 = matchSettlementData([], [dbRow4], [mockProductPrice]);
    // Should return one result for the unmatched DB row
    const pass4 = result4.length === 1 && result4[0].statusLabel === '이월대기';
    console.log('Result 4 (Saturday Unmatched):',
        pass4 ? 'PASS' : 'FAIL',
        result4[0]?.statusLabel
    );

    // Test 5: Receipt Date Matching (Kang Ryu-ah Case)
    console.log('\n[Test 5] Receipt Date Matching (Kang Ryu-ah Case)');
    const excelRow5 = mockSettlementRow({
        customerName: 'Kang Ryu-ah',
        tourDate: '2026-02-06',
        receiptDate: '2026-02-01', // ID-based
        adultCount: 3,
        pax: 3,
        platformAmount: 300,
    });

    const dbRow5 = mockMergedReservation({
        name: 'Kang Ryu-ah',
        tourDate: '2026-02-07', // Different date
        receiptDate: '2026-02-01', // Same receipt date
        adultCount: 3,
        totalPax: 3,
        groupKey: 'Kang Ryu-ah|2026-02-01',
    });

    const result5 = matchSettlementData([excelRow5], [dbRow5], [mockProductPrice]);
    const pass5 = result5.length > 0 && (result5[0].status === 'normal' || result5[0].status === 'warning');
    console.log('Result 5 (Receipt Match):', pass5 ? 'PASS' : 'FAIL', result5[0]?.statusLabel);
    if (result5[0]?.notes.some(n => n.includes('접수일 일치하나'))) {
        console.log('  -> Date Mismatch Warning triggered correctly');
    }

    // Test 6: Fuzzy Receipt Date Matching (Hwang Hyo-jung Case)
    console.log('\n[Test 6] Fuzzy Receipt Date Matching (Hwang Hyo-jung Case)');
    const excelRow6 = mockSettlementRow({
        customerName: 'Hwang Hyo-jung',
        tourDate: '2026-01-15',
        receiptDate: '2025-12-04', // Excel Receipt
        adultCount: 1,
        pax: 1,
        platformAmount: 100,
    });

    const dbRow6 = mockMergedReservation({
        name: 'Hwang Hyo-jung',
        tourDate: '2026-01-15',
        receiptDate: '2025-12-03', // DB Receipt (1 day earlier)
        adultCount: 1,
        totalPax: 1,
        groupKey: 'Hwang Hyo-jung|2025-12-03',
    });

    const result6 = matchSettlementData([excelRow6], [dbRow6], [mockProductPrice]);
    const pass6 = result6.length > 0 && (result6[0].status === 'normal' || result6[0].status === 'warning');
    console.log('Result 6 (Fuzzy Receipt Match):', pass6 ? 'PASS' : 'FAIL', result6[0]?.statusLabel);
    if (result6[0]?.notes.some(n => n.includes('접수일 1일 차이'))) {
        console.log('  -> Date Mismatch Warning triggered correctly');
    }

    // Test 7: Strategy 2 Tolerance (Tour Date +/- 1 day) -> NORMAL (No Warning)
    console.log('\n[Test 7] Strategy 2 Tolerance (Tour Date +/- 1 day)');
    const excelRow7 = mockSettlementRow({
        customerName: 'Tolerance User',
        tourDate: '2026-02-06',
        receiptDate: '', // No receipt date to force Strategy 2
        platformAmount: 100,
        adultCount: 1,
        pax: 1,
    });

    // DB has date 1 day off (2026-02-07)
    const dbRow7 = mockMergedReservation({
        name: 'Tolerance User',
        tourDate: '2026-02-07',
        receiptDate: '2026-01-01',
        groupKey: 'Tolerance User|2026-02-07',
        adultCount: 1,
        totalPax: 1,
    });

    const result7 = matchSettlementData([excelRow7], [dbRow7], [mockProductPrice]);
    // Should be NORMAL and NO date warning
    const pass7 = result7.length > 0 && result7[0].status === 'normal';
    console.log('Result 7 (Tolerance Normal):', pass7 ? 'PASS' : 'FAIL', result7[0]?.statusLabel);

    const hasDateWarning = result7[0]?.notes.some(n => n.includes('불일치') || n.includes('차이'));
    if (!hasDateWarning) {
        console.log('  -> Correctly ignored date difference (No Warning)');
    } else {
        console.log('  -> FAIL: Warning still present:', result7[0]?.notes);
    }

    // Test 8: Consecutive Date Grouping (Park Kyung-min Case)
    console.log('\n[Test 8] Consecutive Date Grouping (Park Kyung-min Case)');
    // Excel: 5 rows on 1/4, 1 row on 1/5. Total 6 pax.
    const excelRows8 = [
        mockSettlementRow({ customerName: 'Park KM', receiptDate: '2026-01-04', platformAmount: 100, pax: 5 }),
        mockSettlementRow({ customerName: 'Park KM', receiptDate: '2026-01-05', platformAmount: 20, pax: 1 })
    ]; // End excelRows8

    // DB: 1 group on 1/3 (1 day diff from 1/4)
    const dbRow8 = mockMergedReservation({
        name: 'Park KM',
        receiptDate: '2026-01-03',
        tourDate: '2026-02-10', // Irrelevant for receipt match
        totalPax: 6,
        groupKey: 'Park KM|2026-01-03'
    });

    const result8 = matchSettlementData(excelRows8, [dbRow8], [mockProductPrice]);

    // Expect: 1 Result (Merged), Match Normal/Warning (Date diff 1/4 vs 1/3 = 1 day -> WARNING "1 day diff")
    // Note: If 1/5 was used, diff would be 2 days -> Fail. So 1/4 (Min) usage is critical.
    const pass8 = result8.length === 1 && (result8[0].status === 'normal' || result8[0].status === 'warning');
    console.log('Result 8 (Merged Grouping):', pass8 ? 'PASS' : 'FAIL', `Count: ${result8.length}, Status: ${result8[0]?.statusLabel}`);

    if (result8.length === 1) {
        const note = result8[0].notes.find(n => n.includes('접수일 1일 차이'));
        if (note) console.log('  -> Correctly used Min Date (1/4) for matching (1 day diff with 1/3)');
        else console.log('  -> Note check:', result8[0].notes);
    }

    // Test 9: Simplified Product Names & Cancelled Item
    console.log('\n[Test 9] Simplified Product Names & Cancelled Classification');

    // Mock Product with Long Name
    const longNameProduct: ProductPrice = { ...mockProductPrice, product_name: 'Long Turtle Name', match_keywords: 'turtle' };

    // 9-1: Check Simplified Name (Turtle -> 1/2부)
    // Excel row with "Turtle" option
    const excelRow9a = mockSettlementRow({ customerName: 'SimpleName', tourDate: '2026-02-10', platformAmount: 100 });
    const dbRow9a = mockMergedReservation({ name: 'SimpleName', tourDate: '2026-02-10', originalOptions: ['Turtle'], groupKey: 'SimpleName|2026-02-10' });

    const result9a = matchSettlementData([excelRow9a], [dbRow9a], [longNameProduct]);
    const name9a = result9a[0]?.classifiedProductName;
    const pass9a = name9a === '1/2부';
    console.log(`Result 9a (Simplified Name): ${pass9a ? 'PASS' : 'FAIL'} ("${name9a}" vs "1/2부")`);

    // 9-2: Check Cancelled Item Classification
    const excelRow9b = mockSettlementRow({
        customerName: 'CancelledUser',
        productName: 'Turtle Snorkeling', // Contains 'Turtle' -> Should map to 1/2부
        platformAmount: 0,
        status: '취소',
        pax: 2
    });
    // Cancelled item usually has no DB match (not fetched) or ignored. 
    // IsFullCancellation check depends on totalAmount <= 0.

    // We pass empty DB list to simulate "Only Excel knows about this cancelled item" OR "DB status is Cancelled (filtered out)".
    // But matchSettlementData handles "isFullCancellation".

    const result9b = matchSettlementData([excelRow9b], [], [longNameProduct]);
    const name9b = result9b[0]?.classifiedProductName;
    const isCancelled = result9b[0]?.status === 'cancelled';
    const pass9b = isCancelled && name9b === '1/2부';

    console.log(`Result 9b (Cancelled Item): ${pass9b ? 'PASS' : 'FAIL'} (Status: ${result9b[0]?.status}, Name: "${name9b}")`);

    // Test 10: Excel Option Fallback (User Request: "1/2부" instead of "Long Product Name")
    console.log('\n[Test 10] Excel Option Fallback');
    const excelRow10 = mockSettlementRow({
        customerName: 'OptionFallback',
        productName: 'Long Product Name',
        option: '09:00 (1부)',
        platformAmount: 100,
        status: '전처리완료'
    });

    // Unmatched Excel Row (Status Error or Cancelled)
    const result10 = matchSettlementData([excelRow10], [], [mockProductPrice]);
    const group10 = result10[0]?.excelGroup;

    // Verify that the group retains the option
    const pass10 = group10?.option === '09:00 (1부)';
    console.log(`Result 10 (Option Retention): ${pass10 ? 'PASS' : 'FAIL'} (Option: "${group10?.option}")`);

    // In UI, we use r.excelGroup?.option.
    // We verified availability here.

    // Test 11: Multi-Date Merging (Jeon Yu-ra)
    console.log('\n[Test 11] Multi-Date Grouping (Jeon Yu-ra)');
    // Scenario: Excel has 1/30. DB has group [1/29, 1/30].
    // Expect: Match finds group, selects 1/30 as best date (Closest), no warning.

    const excelRow11 = mockSettlementRow({
        customerName: 'Jeon Yu-ra',
        tourDate: '2026-01-30',
        receiptDate: '2024-01-15',
        productName: 'Turtle',
        option: '1부',
        platformAmount: 200,
        pax: 2
    });

    const dbRow11 = mockMergedReservation({
        name: 'Jeon Yu-ra',
        tourDate: '2026-01-29', // Default representative date is the first one (earliest)
        allTourDates: ['2026-01-29', '2026-01-30'],
        mergedOption: '1부 + 패러',
        receiptDate: '2024-01-15',
        groupKey: 'Jeon Yu-ra|2024-01-15',
        totalPax: 2,
        adultCount: 2
    });

    const result11 = matchSettlementData([excelRow11], [dbRow11], [mockProductPrice]);
    const matchedDate = result11[0]?.dbGroup?.tourDate;
    const notes11 = result11[0]?.notes || [];
    const hasDateWarning11 = notes11.some(n => n.includes('불일치') || n.includes('차이'));

    // Check: Matched Date should be 1/30 (from allTourDates), NOT 1/29.
    const pass11 = matchedDate === '2026-01-30' && !hasDateWarning11;

    console.log(`Result 11 (Closest Date): ${pass11 ? 'PASS' : 'FAIL'} (Matched: ${matchedDate}, Warning: ${hasDateWarning11})`);
    if (!pass11) console.log('  -> Notes:', notes11);


    console.log('\n--- Verification Complete ---');
}

runTests().catch(console.error);
