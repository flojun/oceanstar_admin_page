import crypto from 'crypto';
import { getPickupDisplayNameByLang } from '@/constants/pickupLocations';

/**
 * 연락처 칸(자유 입력)을 솔라피가 받는 꼴 { country, to } 로 바꾼다.
 * 카카오톡 ID 처럼 번호가 아니거나 한국·미국 번호가 아니면 null — 보내지 않는다.
 */
export function toSolapiPhone(contact: string): { country: string; to: string } | null {
    const raw = contact.replace(/[\s\-().]/g, '');
    if (!/^\+?\d+$/.test(raw)) return null;
    const digits = raw.replace('+', '');
    // 한국: 010…, +82 10…, +82 010…
    if (/^01\d{8,9}$/.test(digits)) return { country: '82', to: digits };
    const kr = digits.match(/^820?(1\d{8,9})$/);
    if (kr) return { country: '82', to: `0${kr[1]}` };
    // 미국: 808…(10자리), 1 808…, +1 808…
    const us = digits.match(/^1?([2-9]\d{9})$/);
    if (us) return { country: '1', to: us[1] };
    return null;
}

/**
 * 예약 알림톡 템플릿들이 함께 쓰는 변수. 이름은 솔라피 템플릿의 #{…} 와 같아야 한다.
 * 픽업은 손님용 이름으로 — "HM (2:35)" → "H&M" (시간은 #{픽업시간} 이 따로 맡는다).
 */
export function bookingVars(r: { name?: string; order_id?: string; tour_date?: string; option?: string; pax?: string; pickup_location?: string }) {
    const pickup = (r.pickup_location ?? '').replace(/\(.*?\)/g, '').trim();
    return { 이름: r.name, 예약번호: r.order_id, 날짜: r.tour_date, 투어: r.option, 인원: r.pax, 픽업: getPickupDisplayNameByLang(pickup, 'ko') };
}

/**
 * 솔라피로 알림톡 한 통. 키가 없거나(설정 전) 번호를 못 읽으면 조용히 건너뛰고 false.
 * 실패 시 문자 대체발송은 끈다 — 한국 발신번호가 등록돼 있지 않다.
 */
export async function sendAlimtalk(contact: string, templateId: string | undefined, variables: Record<string, string | number | null | undefined>) {
    const { SOLAPI_API_KEY: apiKey, SOLAPI_API_SECRET: secret, SOLAPI_PF_ID: pfId } = process.env;
    if (!apiKey || !secret || !pfId || !templateId) return false;
    const phone = toSolapiPhone(contact);
    if (!phone) return false;

    // 서명은 SDK(solapi 6.x getAuthInfo)와 같은 방식: HMAC-SHA256(date + salt), hex
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto.createHmac('sha256', secret).update(date + salt).digest('hex');

    const res = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
        method: 'POST',
        headers: {
            Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [{
                ...phone,
                kakaoOptions: {
                    pfId,
                    templateId,
                    variables: Object.fromEntries(Object.entries(variables).map(([k, v]) => [`#{${k}}`, String(v || "-")])),
                    disableSms: true,
                },
            }],
        }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.failedMessageList?.length) {
        throw new Error(`알림톡 접수 실패 (${res.status}): ${JSON.stringify(body?.failedMessageList ?? body)}`);
    }
    return true;
}
