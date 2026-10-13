/**
 * 예약 메일 형식 점검. 플랫폼이 메일 양식을 바꾸면 파서가 **조용히 엉뚱한 값을 읽는다.**
 *   - GYG 가 상품 제목에 "Free Pickup" 을 넣자 상품명이 픽업 주소로 읽혔다 (2026-10)
 *   - 여기어때 상품명 끝 "(옵션:선셋)" 때문에 1부가 3부로 들어갔다
 * 둘 다 메일은 "읽혔다". 실패가 아니라 오답이라 알림이 울리지 않았다.
 *
 * 그래서 매일 지난 메일을 다시 읽어 ① 있어야 할 칸이 그대로 있는지 ② 읽은 값이 말이 되는지 본다.
 * 여기 함수들은 IMAP·DB 없이 돌아가는 순수 검사다. 수집·알림은 /api/cron/audit-email-formats.
 */
import { htmlToText, type OtaBooking, type OtaPlatform } from './otaEmailParser.ts';
import type { MRTParseResult } from './myrealTripEmailParser.ts';

export type AuditPlatform = OtaPlatform | 'myrealtrip';

/**
 * 신규 예약 메일에 **줄 머리로** 있어야 하는 칸 이름. 하나라도 없으면 양식이 바뀐 것이다.
 * 줄 머리로 보는 이유: 칸 이름이 제목·상품명 안에 섞여 들어가도(GYG "Free Pickup") 통과하면 안 된다.
 */
export const BOOKING_LABELS: Record<AuditPlatform, { subject: RegExp; labels: string[] }> = {
    myrealtrip: { subject: /확정대기|확정완료/, labels: ['예약번호', '상품명', '옵션명', '여행일', '여행자'] },
    klook: { subject: /예약내역 확정|예약 요청/, labels: ['예약 확인 ID', '요청 날짜', '여행자', '영문 이름', '숙박하시는 호텔 주소'] },
    gyg: { subject: /^Booking - |New booking received/i, labels: ['Reference number', 'Date', 'Number of participants', 'Main customer', 'Pickup'] },
    viator: { subject: /^New Booking/i, labels: ['Booking Reference', 'Travel Date', 'Lead Traveler Name', 'Travelers', 'Tour Grade'] },
    yeogi: { subject: /확정/, labels: ['상품', '옵션', '총 인원', '이용일'] },
    triple: { subject: /접수|Booking Received/i, labels: ['파트너 예약번호', '예약아이템 정보', '이용예정일'] },
    zoomzoom: { subject: /접수/, labels: ['예약 번호', '여행일', '인원'] },
};

const ORDER_ID: Record<AuditPlatform, RegExp> = {
    myrealtrip: /^EXP-\d{8}-\d{8}$/,
    klook: /^[A-Z]{3}\d{6}$/,
    gyg: /^GYG[A-Z0-9]{8,}$/,
    viator: /^BR-\d{6,}$/,
    yeogi: /^[0-9A-Z]{12,}$/,
    triple: /^\d{5,}$/,
    zoomzoom: /^\d{5,}$/,
};

/** 상품명·투어 설명에 쓰이는 말. 이름이나 픽업 칸에 이게 보이면 엉뚱한 줄을 읽은 것이다. */
const PRODUCTISH = /turtle|snorkel|activit|canyon|pick-?up\]|스노클링|해양|액티비티/i;

const OPTIONS = new Set(['1부', '2부', '3부', '']);

/** 메일 본문에서 줄 머리로 찾지 못한 칸 이름들. */
export function missingLabels(html: string, labels: string[]): string[] {
    const heads = htmlToText(html).split('\n').map((l) => l.replace(/^[\s・·•|\-]+/, '').trim());
    return labels.filter((label) => !heads.some((l) => l.startsWith(label)));
}

/** 'YYYY-MM-DD' 가 실제 날짜이고 지난 3일 ~ 앞으로 2년 사이인가. */
function plausibleTourDate(d: string, now: Date): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const t = Date.parse(`${d}T12:00:00Z`);
    if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== d) return false;
    const days = (t - now.getTime()) / 86_400_000;
    return days > -3 && days < 730;
}

/** OTA 파서가 읽어 낸 값이 말이 되는지. 문제가 없으면 빈 배열. */
export function checkOtaBooking(b: OtaBooking, now = new Date()): string[] {
    const problems: string[] = [];
    if (!ORDER_ID[b.platform].test(b.orderId)) problems.push(`예약번호 형식 이상: "${b.orderId}"`);
    if (b.kind !== 'new') return problems;   // 취소·변경 메일은 예약번호만 쓴다

    if (!plausibleTourDate(b.tourDate, now)) problems.push(`투어일 이상: "${b.tourDate}"`);
    if (!b.name) problems.push('이름을 못 읽음');
    else if (b.name.length > 60 || PRODUCTISH.test(b.name)) problems.push(`이름 자리에 다른 값: "${b.name.slice(0, 60)}"`);

    const total = Number(b.pax.match(/^(\d+)명$/)?.[1] || 0);
    if (!total || total > 40) problems.push(`인원 이상: "${b.pax}"`);
    else if (b.adultCount + b.childCount > 0 && b.adultCount + b.childCount !== total) {
        problems.push(`인원 합계 불일치: 성인 ${b.adultCount} + 아동 ${b.childCount} ≠ ${b.pax}`);
    }

    if (!OPTIONS.has(b.option)) problems.push(`부 이상: "${b.option}"`);
    if (b.pickupLocation && (b.pickupLocation.length > 150 || PRODUCTISH.test(b.pickupLocation))) {
        problems.push(`픽업 자리에 다른 값: "${b.pickupLocation.slice(0, 80)}"`);
    }
    return problems;
}

/** 마이리얼트립 파서가 읽어 낸 값이 말이 되는지. */
export function checkMrtReservation(p: MRTParseResult, now = new Date()): string[] {
    const r = p.reservation;
    const problems: string[] = [];
    if (p.type !== 'cancel_request' && !ORDER_ID.myrealtrip.test(r.orderNumber)) {
        problems.push(`예약번호 형식 이상: "${r.orderNumber}"`);
    }
    if (!r.travelerName || r.travelerName.length > 30 || PRODUCTISH.test(r.travelerName)) {
        problems.push(`여행자 이름 이상: "${(r.travelerName || '').slice(0, 40)}"`);
    }
    // 취소 메일은 지난 날짜일 수 있다. 신규·확정만 범위를 본다.
    if ((p.type === 'pending' || p.type === 'confirmed') && !plausibleTourDate(r.tourDate, now)) {
        problems.push(`여행일 이상: "${r.tourDate}"`);
    }
    if ((p.type === 'pending' || p.type === 'confirmed') && !r.optionName) problems.push('옵션명을 못 읽음');
    return problems;
}

/**
 * cron 검색에 안 걸린 제목 중 **예약 관련으로 보이는 것.** 플랫폼이 제목을 바꾸면 메일이 통째로 안 들어온다.
 * 인증번호·메시지·후기·독촉처럼 원래 안 읽는 메일은 뺀다.
 */
export function looksLikeMissedBookingSubject(subject: string): boolean {
    if (!/예약|booking|reservation|취소|cancel|접수|확정/i.test(subject)) return false;
    return !/인증|verification|후기|review|문의|message|메시지|messaged|conversation|필수 조치|예약확정 요청 안내|정보 업데이트|필수 입력|부분환불|정산|settlement|invoice|payout|심사/i.test(subject);
}
