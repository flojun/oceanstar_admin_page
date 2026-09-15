/**
 * 대시보드 집계 자체검사.  실행: node scripts/check_dashboard_stats.ts
 */
import assert from 'node:assert';
import {
    aggregate,
    monthRange,
    normalizeSource,
    monthColumn,
    parsePax,
    sortByMetric,
    totalsByPlatform,
    type StatsRow,
} from '../src/lib/dashboardStats.ts';

const row = (o: Partial<StatsRow>): StatsRow => ({ status: '예약확정', pax: '2명', ...o });

// ---- parsePax ----
assert.equal(parsePax('3명'), 3);
assert.equal(parsePax('12'), 12);
assert.equal(parsePax(''), 0);
assert.equal(parsePax(null), 0);
assert.equal(parsePax('성인2/아동1'), 21, 'ponytail: 숫자만 뽑으므로 복합 표기는 못 읽는다 — 실제 데이터는 "N명" 형식');

// ---- normalizeSource: 표기 병합 ----
assert.equal(normalizeSource('팜')!.label, '팜투어');
assert.equal(normalizeSource('팜투어')!.label, '팜투어');
assert.equal(normalizeSource('탐')!.label, '타미스');
assert.equal(normalizeSource('g')!.label, 'GetYourGuide');
assert.equal(normalizeSource('GY')!.label, 'GetYourGuide');
assert.equal(normalizeSource('kTB')!.label, 'KTB');
assert.equal(normalizeSource('viator')!.label, 'Viator');
assert.equal(normalizeSource('클록')!.label, '클룩');
assert.equal(normalizeSource('헬로우')!.label, '헬로');
assert.equal(normalizeSource('웹사이트(EN)')!.label, '자사 웹사이트');
assert.equal(normalizeSource('개인 - 권태신')!.label, '개인·지인');
assert.equal(normalizeSource(' M ')!.label, '마이리얼트립');

// ---- normalizeSource: 카테고리 ----
assert.equal(normalizeSource('M')!.category, 'ota');
assert.equal(normalizeSource('타미스')!.category, 'agency');
assert.equal(normalizeSource('웹')!.category, 'direct');
assert.equal(normalizeSource('처음보는거래처')!.category, 'agency', '모르는 source 는 여행사로 통과');
assert.equal(normalizeSource('처음보는거래처')!.label, '처음보는거래처');

// ---- normalizeSource: 제외 ----
for (const bad of ['', '  ', '테스트', 'LOLA', 'lola', '`', null, undefined]) {
    assert.equal(normalizeSource(bad), null, `제외되어야 함: ${JSON.stringify(bad)}`);
}

// ---- monthRange ----
assert.deepEqual(
    monthRange({ year: 2025, month: 11 }, { year: 2026, month: 2 }).map(m => m.month),
    [11, 12, 1, 2],
);
assert.equal(monthRange({ year: 2026, month: 5 }, { year: 2026, month: 1 }).length, 0, '역순 범위는 빈 배열');

// ---- aggregate ----
const months = monthRange({ year: 2026, month: 1 }, { year: 2026, month: 3 });
const rows: StatsRow[] = [
    row({ source: 'M', tour_date: '2026-01-05', receipt_date: '2025-12-20', pax: '2명' }),
    row({ source: 'M', tour_date: '2026-03-31', receipt_date: '2026-01-02', pax: '4명' }),
    row({ source: '팜', tour_date: '2026-01-11', receipt_date: '2026-01-11', pax: '3명' }),
    row({ source: '팜투어', tour_date: '2026-01-20', receipt_date: '2026-01-20', pax: '1명' }),
    row({ source: '웹사이트', tour_date: '2026-02-02', receipt_date: '2026-02-02', pax: '5명' }),
    row({ source: 'M', tour_date: '2026-02-10', receipt_date: '2026-02-10', pax: '9명', status: '취소' }),
    row({ source: '테스트', tour_date: '2026-02-10', receipt_date: '2026-02-10', pax: '9명' }),
    row({ source: 'LOLA', tour_date: '2026-02-10', receipt_date: '2026-02-10', pax: '99명' }),
    row({ source: 'M', tour_date: '', receipt_date: '', pax: '7명' }),
    row({ source: 'M', tour_date: '2027-06-01', receipt_date: '2027-06-01', pax: '8명' }),
];

const all = aggregate(rows, months, { dateField: 'tour_date', category: 'all' });
assert.deepEqual(all.months, ['2026-01', '2026-02', '2026-03']);
assert.equal(all.totalCount, 5, '취소·테스트·LOLA·날짜없음·범위밖 제외');
assert.equal(all.totalPax, 2 + 4 + 3 + 1 + 5);
assert.deepEqual(all.pax['마이리얼트립'], [2, 0, 4], '빈 월은 0 으로 채운다');
assert.deepEqual(all.pax['팜투어'], [4, 0, 0], '팜 + 팜투어 가 하나로 합쳐진다');
assert.deepEqual(all.count['팜투어'], [2, 0, 0]);
assert.deepEqual(all.platforms, ['마이리얼트립', '자사 웹사이트', '팜투어'], '인원 누적 내림차순');

// ---- 기준일 전환 ----
const byReceipt = aggregate(rows, months, { dateField: 'receipt_date', category: 'all' });
assert.deepEqual(byReceipt.pax['마이리얼트립'], [4, 0, 0], '접수일 기준이면 1월로 몰린다');
assert.equal(byReceipt.totalPax, 4 + 3 + 1 + 5, '여행일 기준(15명)과 달라야 한다');

// ---- 카테고리 필터 ----
const ota = aggregate(rows, months, { dateField: 'tour_date', category: 'ota' });
assert.deepEqual(ota.platforms, ['마이리얼트립']);
assert.equal(ota.totalPax, 6);

const agency = aggregate(rows, months, { dateField: 'tour_date', category: 'agency' });
assert.deepEqual(agency.platforms, ['팜투어']);

const direct = aggregate(rows, months, { dateField: 'tour_date', category: 'direct' });
assert.deepEqual(direct.platforms, ['자사 웹사이트']);
assert.equal(ota.totalCount + agency.totalCount + direct.totalCount, all.totalCount, '카테고리 합 = 전체');

// OTA + 직접유입 묶음 (여행사만 빠진다)
const online = aggregate(rows, months, { dateField: 'tour_date', category: 'online' });
assert.deepEqual(online.platforms, ['마이리얼트립', '자사 웹사이트'], '여행사(팜투어)는 빠진다');
assert.equal(online.totalCount, ota.totalCount + direct.totalCount);
assert.equal(online.totalPax, ota.totalPax + direct.totalPax);
assert.equal(online.totalCount + agency.totalCount, all.totalCount, 'OTA+직접유입 과 여행사를 더하면 전체');

// ---- 계열 12개 초과 시 기타로 합산 ----
const many: StatsRow[] = Array.from({ length: 20 }, (_, i) =>
    row({ source: `거래처${String(i).padStart(2, '0')}`, tour_date: '2026-01-05', pax: `${20 - i}명` }),
);
const capped = aggregate(many, months, { dateField: 'tour_date', category: 'all' });
assert.equal(capped.platforms.length, 8);
assert.equal(capped.platforms[7], '기타');
assert.equal(
    totalsByPlatform(capped, 'pax')['기타'],
    // 20명부터 1명씩 줄어드는 20개 중, 상위 7개를 뺀 나머지
    Array.from({ length: 20 }, (_, i) => 20 - i).slice(7).reduce((a, b) => a + b, 0),
);
assert.equal(capped.totalCount, 20, '기타로 합쳐도 총계는 그대로');

// ---- 자사 웹사이트/인스타는 비중이 작아도 "기타" 로 묻히지 않는다 ----
const noisy: StatsRow[] = [
    ...Array.from({ length: 20 }, (_, i) =>
        row({ source: `거래처${String(i).padStart(2, '0')}`, tour_date: '2026-01-05', pax: `${50 - i}명` }),
    ),
    row({ source: '웹사이트', tour_date: '2026-01-06', pax: '2명' }),   // 꼴찌급 인원
    row({ source: '인스타', tour_date: '2026-01-06', pax: '1명' }),
];
const pinned = aggregate(noisy, months, { dateField: 'tour_date', category: 'all' });
assert.equal(pinned.platforms.length, 8);
assert(pinned.platforms.includes('자사 웹사이트'), '자사 웹사이트는 항상 개별 계열');
assert(pinned.platforms.includes('인스타그램'), '인스타그램은 항상 개별 계열');
assert.equal(pinned.platforms[7], '기타');
assert.equal(pinned.totalCount, 22, '기타로 묶여도 총계는 그대로');

// ---- 값이 큰 것부터 정렬, "기타" 는 맨 뒤 ----
const col = monthColumn(pinned, 0);
const byPax = sortByMetric(col, 'pax');
assert.deepEqual(
    byPax.map(c => c.pax),
    [...byPax.filter(c => c.platform !== '기타').map(c => c.pax)].sort((a, b) => b - a).concat(
        byPax.filter(c => c.platform === '기타').map(c => c.pax),
    ),
    '인원 내림차순',
);
assert.equal(byPax[byPax.length - 1].platform, '기타');
assert.equal(byPax[0].platform, '거래처00', '가장 많은 플랫폼이 맨 앞');

// 건수 기준이면 순서가 달라질 수 있다 (정렬이 metric 을 실제로 본다)
const mixed = aggregate([
    row({ source: 'M', tour_date: '2026-01-01', pax: '10명' }),   // 1건 10명
    row({ source: '웹사이트', tour_date: '2026-01-02', pax: '1명' }),
    row({ source: '웹사이트', tour_date: '2026-01-03', pax: '1명' }),
    row({ source: '웹사이트', tour_date: '2026-01-04', pax: '1명' }), // 3건 3명
], months, { dateField: 'tour_date', category: 'all' });
const mixedCol = monthColumn(mixed, 0);
assert.equal(sortByMetric(mixedCol, 'pax')[0].platform, '마이리얼트립');
assert.equal(sortByMetric(mixedCol, 'count')[0].platform, '자사 웹사이트');

console.log('✅ dashboardStats 자체검사 통과');
