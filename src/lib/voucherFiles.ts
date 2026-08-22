import os from 'os';
import path from 'path';
import fs from 'fs';
import { supabaseServer } from '@/lib/supabaseServer';

const BUCKET = 'vouchers';
const CACHE_ROOT = path.join(os.tmpdir(), 'oceanstar-vouchers');

/**
 * DB의 pickup_location 값 -> 바우처 파일 키.
 * 키는 한/영 공통이라 폴더(en/ko)만 갈아끼우면 된다.
 */
const LOCATION_KEYS: Record<string, string> = {
    'HM': 'HM',
    'H&M': 'HM',
    '녹색천막': 'GreenTent',
    '소화전': 'GreenTent',
    '알라모아나': 'Alamoana',
    '알모': 'Alamoana',
    '직접': 'Harbor',
    'DIRECT': 'Harbor',
    '카라이': 'KaLai',
    '리츠칼튼': 'Ritz',
    '르네상스': 'Renaissance',
    '프린스': 'Prince',
    '카할라': 'Kahala',
    'IHOP': 'IHOP',
    'HGI': 'HGI',
    'HIE': 'HIE',
    'HP': 'HP',
    'WR': 'WR',
};

/**
 * 선셋은 계절에 따라 출항 시각이 바뀌고, 장소마다 픽업 시각이 다르다.
 * 아래 표는 업로드된 파일명에서 그대로 뽑은 것이라 파일과 항상 일치한다.
 * 바깥 키는 선셋 세트(= 출항 시각), 안쪽 값은 그 장소의 픽업 시각.
 */
type SunsetSet = '130' | '230' | '300' | '330';
const SUNSET_PICKUP: Record<string, Record<SunsetSet, string>> = {
    Alamoana: { '130': '145', '230': '245', '300': '315', '330': '345' },
    GreenTent: { '130': '130', '230': '230', '300': '300', '330': '330' },
    HGI: { '130': '130', '230': '230', '300': '300', '330': '330' },
    HIE: { '130': '140', '230': '240', '300': '310', '330': '340' },
    HM: { '130': '135', '230': '235', '300': '305', '330': '335' },
    HP: { '130': '120', '230': '220', '300': '250', '330': '320' },
    Harbor: { '130': '150', '230': '250', '300': '320', '330': '350' },
    IHOP: { '130': '140', '230': '240', '300': '310', '330': '340' },
    KaLai: { '130': '140', '230': '240', '300': '310', '330': '340' },
    Kahala: { '130': '110', '230': '210', '300': '240', '330': '310' },
    Prince: { '130': '145', '230': '245', '300': '315', '330': '345' },
    Renaissance: { '130': '145', '230': '245', '300': '315', '330': '345' },
    Ritz: { '130': '140', '230': '240', '300': '310', '330': '340' },
    WR: { '130': '130', '230': '230', '300': '300', '330': '330' },
};

/** tour_settings.start_time("15:00") -> 선셋 세트("300") */
const START_TIME_TO_SET: Record<string, SunsetSet> = {
    '13:30': '130',
    '14:30': '230',
    '15:00': '300',
    '15:30': '330',
};

type Session = '1' | '2' | '3';

/** "HM (3:05)" -> { key: 'HM', time: '305' } */
function parsePickup(pickupLocation: string): { key: string | null; time: string | null } {
    const raw = (pickupLocation || '').trim();

    // 선셋 예약은 픽업 시간이 괄호로 붙어 오기도 한다: "프린스 (3;15)"
    const t = raw.match(/\((\d{1,2})[;:](\d{2})\)/);
    const time = t ? `${t[1]}${t[2]}` : null;

    const name = raw.replace(/\(.*?\)/g, '').trim();
    let key = LOCATION_KEYS[name] ?? null;
    if (!key) {
        const hit = Object.keys(LOCATION_KEYS).find(k => name.startsWith(k));
        if (hit) key = LOCATION_KEYS[hit];
    }
    return { key, time };
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
        console.error('[voucher] 선셋 출항 시각을 읽지 못했습니다:', error?.message);
        return null;
    }
    const set = START_TIME_TO_SET[String(data.start_time).slice(0, 5)];
    if (!set) {
        console.error(`[voucher] 선셋 세트가 없는 출항 시각: ${data.start_time}`);
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

/**
 * 한국어 + 영어 바우처를 모두 첨부한다.
 * 한쪽이 없어도 있는 것만 돌려주고, 둘 다 없으면 빈 배열이다.
 * 바우처 누락이 예약 확정 메일 자체를 막아서는 안 된다.
 */
export async function getVoucherAttachments(pickupLocation: string, option: string) {
    const fileName = await resolveVoucherFile(pickupLocation, option);
    if (!fileName) return [];

    const key = fileName.split('_')[0];
    const session = parseSession(option);

    const [ko, en] = await Promise.all([
        downloadVoucher('ko', fileName),
        downloadVoucher('en', fileName),
    ]);

    const attachments: { filename: string; path: string }[] = [];
    if (ko) attachments.push({ filename: `오션스타_바우처_${key}_${session}부.pdf`, path: ko });
    if (en) attachments.push({ filename: `OceanStar_Voucher_${key}_${SESSION_EN[session]}.pdf`, path: en });

    if (attachments.length < 2) {
        console.warn(`[voucher] ${fileName}: 첨부 ${attachments.length}/2`);
    }
    return attachments;
}
