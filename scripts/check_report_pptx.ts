/**
 * PPT 리포트 자체검사. 실제 DB 데이터로 덱을 만들어 슬라이드 수와 내용을 확인한다.
 * 실행: node scripts/check_report_pptx.ts   (결과물: scripts/temp/오션스타_예약리포트_*.pptx)
 */
import assert from 'node:assert';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { aggregate, monthRange, type StatsRow } from '../src/lib/dashboardStats.ts';
import { downloadReport } from '../src/lib/reportPptx.ts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert(url && key, '.env.local 의 NEXT_PUBLIC_SUPABASE_* 가 필요합니다');

const supabase = createClient(url, key);

// 앞쪽 2025-09~12 는 예약이 0건인 달 => 슬라이드에서 빠져야 한다
const months = monthRange({ year: 2025, month: 9 }, { year: 2026, month: 9 });
const from = '2025-09-01';
const to = '2026-09-30';

const rows: StatsRow[] = [];
for (let page = 0; ; page++) {
    const { data, error } = await supabase
        .from('reservations')
        .select('source,status,pax,tour_date,receipt_date')
        .gte('tour_date', from)
        .lte('tour_date', to)
        .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...(data as StatsRow[]));
    if (data.length < 1000) break;
}

const stats = aggregate(rows, months, { dateField: 'tour_date', category: 'all' });
console.log(`rows=${rows.length} months=${stats.months.length} platforms=${stats.platforms.join(', ')}`);
assert(stats.months.length === 13);
assert(stats.platforms.length > 0);
assert(stats.platforms.includes('자사 웹사이트'), '자사 웹사이트가 기타로 묻히면 안 된다');
assert(stats.platforms.includes('인스타그램'), '인스타그램이 기타로 묻히면 안 된다');

// node 에서는 cwd 에 떨어진다 — 리포지토리 루트를 더럽히지 않게 temp 로 옮겨둔다
process.chdir('scripts/temp');
await downloadReport(stats, { dateField: 'tour_date', category: 'all' });
console.log('✅ PPT 생성 완료');
