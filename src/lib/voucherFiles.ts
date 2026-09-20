import os from 'os';
import path from 'path';
import fs from 'fs';
import { supabaseServer } from '@/lib/supabaseServer';
import {
    SUNSET_PICKUP,
    type SunsetSet,
    locationKey,
    sunsetPickupTo24h,
    sunsetSetOf,
} from '@/lib/sunsetPickup';

const BUCKET = 'vouchers';
const CACHE_ROOT = path.join(os.tmpdir(), 'oceanstar-vouchers');

type Session = '1' | '2' | '3';

/** "HM (3:05)" -> { key: 'HM', time: '305' } */
function parsePickup(pickupLocation: string): { key: string | null; time: string | null } {
    const raw = (pickupLocation || '').trim();

    // 선셋 예약은 픽업 시간이 괄호로 붙어 오기도 한다: "프린스 (3;15)"
    const t = raw.match(/\((\d{1,2})[;:](\d{2})\)/);
    const time = t ? `${t[1]}${t[2]}` : null;

    return { key: locationKey(raw), time };
}

function parseSession(option: string): Session {
    const o = option || '';
    if (o.includes('3부') || o.includes('선셋') || /sunset/i.test(o)) return '3';
    if (o.includes('2부') || o.includes('11:00')) return '2';
    return '1';
}

/** 괄호에 시간이 없는 선셋 예약을 위해 현재 운행 중인 선셋 세트를 읽는다. */
async function currentSunsetSet(): Promise<SunsetSet | null> {
    const { data, error } = await supabaseServer
        .from('tour_settings')
        .select('start_time')
        .eq('tour_id', 'sunset')
        .single();

    if (error || !data?.start_time) {
        console.error('[voucher] 선셋 기준 픽업 시각을 읽지 못했습니다:', error?.message);
        return null;
    }
    const set = sunsetSetOf(data.start_time);
    if (!set) {
        console.error(`[voucher] 선셋 세트가 없는 기준 픽업 시각: ${data.start_time}`);
        return null;
    }
    return set;
}

/** 첨부할 파일명을 정한다. 붙일 수 없으면 null. */
export async function resolveVoucherFile(pickupLocation: string, option: string): Promise<string | null> {
    const { key, time } = parsePickup(pickupLocation);
    if (!key) {
        console.warn(`[voucher] 매핑되지 않은 픽업 장소: "${pickupLocation}"`);
        return null;
    }

    const session = parseSession(option);
    if (session !== '3') return `${key}_${session}.pdf`;

    // 괄호에 적힌 시간이 가장 정확하다. 없으면 현재 선셋 세트로 표에서 찾는다.
    if (time) return `${key}_3_${time}.pdf`;

    const set = await currentSunsetSet();
    const fallback = set ? SUNSET_PICKUP[key]?.[set] : null;
    if (!fallback) {
        console.warn(`[voucher] 선셋 픽업 시각을 정하지 못함: "${pickupLocation}" / "${option}"`);
        return null;
    }
    return `${key}_3_${fallback}.pdf`;
}

/**
 * 예약 한 건의 픽업 시각을 "HH:MM" 으로 정한다. 못 정하면 null.
 *
 * 1·2부는 pickup_locations 의 time_1 / time_2 가 곧 픽업 시각이다.
 * 3부(선셋)는 계절 세트마다 장소별 시각이 달라서 바우처 PDF 와 같은 표에서 찾는다.
 * 예약 문자열에 "프린스 (3;15)" 처럼 시각이 박혀 있으면 그 값이 가장 정확하다.
 */
export async function resolvePickupTime(pickupLocation: string, option: string): Promise<string | null> {
    const { key, time } = parsePickup(pickupLocation);
    if (!key) return null;

    const session = parseSession(option);

    if (session === '3') {
        if (time) return sunsetPickupTo24h(time);
        const set = await currentSunsetSet();
        const compact = set ? SUNSET_PICKUP[key]?.[set] : null;
        return compact ? sunsetPickupTo24h(compact) : null;
    }

    const { data, error } = await supabaseServer
        .from('pickup_locations')
        .select('name, time_1, time_2');

    if (error || !data) {
        console.error('[voucher] 픽업 시각을 읽지 못했습니다:', error?.message);
        return null;
    }

    const row = data.find((loc: { name: string }) => locationKey(loc.name) === key);
    const raw = session === '2' ? row?.time_2 : row?.time_1;
    return raw ? String(raw).slice(0, 5) : null;
}

/** Storage에서 받아 임시폴더에 캐시한다. 실패하면 null. */
async function downloadVoucher(lang: 'ko' | 'en', fileName: string): Promise<string | null> {
    const cached = path.join(CACHE_ROOT, lang, fileName);
    if (fs.existsSync(cached)) return cached;

    const { data, error } = await supabaseServer.storage
        .from(BUCKET)
        .download(`${lang}/${fileName}`);

    if (error || !data) {
        console.error(`[voucher] 다운로드 실패 ${lang}/${fileName}:`, error?.message);
        return null;
    }

    fs.mkdirSync(path.dirname(cached), { recursive: true });
    fs.writeFileSync(cached, Buffer.from(await data.arrayBuffer()));
    return cached;
}

const SESSION_EN: Record<Session, string> = { '1': '1st', '2': '2nd', '3': '3rd' };

/** 파일명("HM_3_305.pdf")에서 세션을 읽는다. */
function sessionOf(fileName: string): Session {
    return (fileName.split('_')[1]?.replace('.pdf', '') as Session) ?? '1';
}

/**
 * 해당 언어의 바우처 첨부 하나를 만든다. 받아오지 못하면 null.
 * 바우처 누락이 예약 확정 메일 자체를 막아서는 안 된다.
 */
export async function getVoucherAttachment(lang: 'ko' | 'en', fileName: string) {
    const local = await downloadVoucher(lang, fileName);
    if (!local) return null;

    const key = fileName.split('_')[0];
    const session = sessionOf(fileName);
    const filename = lang === 'ko'
        ? `오션스타_바우처_${key}_${session}부.pdf`
        : `OceanStar_Voucher_${key}_${SESSION_EN[session]}.pdf`;

    return { filename, path: local };
}
