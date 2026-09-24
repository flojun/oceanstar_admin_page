/**
 * Klook / GetYourGuide / Viator / 여기어때 파트너 메일 파서.
 *
 * 메일 HTML을 한 번 평문으로 눕힌 뒤 "라벨 → 값"으로 뽑는다.
 * 라벨과 값이 같은 줄에 있든(평문·여기어때) 다른 테이블 셀에 있든(클룩) 동작한다.
 *
 * 신규/취소 판정은 **제목 우선**. 클룩은 취소 메일 본문이 신규와 완전히 동일해서
 * 본문으로는 구분이 불가능하다.
 */

export type OtaPlatform = 'klook' | 'gyg' | 'viator' | 'yeogi';
export type OtaEmailKind = 'new' | 'cancel' | 'partial_cancel' | 'update';

export interface OtaBooking {
    kind: OtaEmailKind;
    platform: OtaPlatform;
    source: string;          // reservations.source 에 그대로 들어갈 값
    orderId: string;
    name: string;
    tourDate: string;        // YYYY-MM-DD
    option: string;          // 1부 | 2부 | 3부 | ''
    pax: string;             // "2명"
    adultCount: number;
    childCount: number;
    pickupLocation: string;
    contact: string;
    bookerEmail: string;
    note: string;
}

/** DB source 컬럼 실측값에 맞춘다 (클록=기존 표기 그대로) */
export const OTA_SOURCE: Record<OtaPlatform, string> = {
    klook: '클록',
    gyg: 'G',
    viator: 'Viator',
    yeogi: '여기어때',
};

/**
 * 사람에게 보여 줄 플랫폼 이름. DB 의 source 값(`OTA_SOURCE`)은 표에서 좁게 쓰려고
 * 줄여 놓은 코드라 'G' 처럼 알림에 실으면 어디서 온 예약인지 알 수 없다.
 */
export const OTA_LABEL: Record<OtaPlatform, string> = {
    klook: '클룩',
    gyg: 'GetYourGuide',
    viator: 'Viator',
    yeogi: '여기어때',
};

/** IMAP `from` 검색어. imapflow 의 from 은 값을 하나만 받아서 플랫폼별로 따로 검색한다. */
export const OTA_FROM: Record<OtaPlatform, string> = {
    klook: 'klook',
    gyg: 'getyourguide',
    viator: 'viator',
    yeogi: 'yeogi',
};

/**
 * 제목 필터. 마케팅·문의·정산 메일까지 다 긁어오면 파싱 실패만 쌓이므로 IMAP 단계에서 걸러낸다.
 * Gmail 의 IMAP SUBJECT 검색은 **단어 단위**라 "GYG" 로 "GYG7VKNBZW4M" 을 못 찾는다.
 * 그래서 GYG 는 실제 제목에 쓰이는 단어 두 개로 나눠 검색한다.
 *   Booking - S… / Urgent: New booking received / A booking has been canceled  → "Booking"
 *   GYG… was cancelled                                                        → "cancelled"
 */
export const OTA_SUBJECT: Record<OtaPlatform, string[]> = {
    klook: ['예약', '취소'],  // 예약내역 확정 / 예약 요청 / 확정된 예약 취소 / **부분 취소**(제목에 '예약' 없음)
    gyg: ['Booking', 'cancelled'],
    viator: ['Booking'],      // New Booking for… / Cancelled Booking:…
    yeogi: ['예약'],          // 예약이 확정되었어요
};

// ============================================================
// 텍스트 유틸
// ============================================================

function htmlToText(html: string): string {
    return html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(td|th|tr|p|div|li|h[1-6]|table)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;|&#160;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/[‎‏⁦-⁩]/g, '')   // Viator 가 섞어 보내는 방향 제어 문자
        .split('\n')
        .map((l) => l.replace(/\s+/g, ' ').trim())
        .join('\n');
}

/**
 * 라벨 뒤의 값을 뽑는다.
 * 1) 같은 줄에 값이 있으면 그걸 쓴다.
 * 2) 같은 줄이 비었거나 라벨이 다음 줄로 넘어간 형태(":"로 끝남)면 다음 비지 않은 줄을 쓴다.
 *    클룩의 "숙박하시는 호텔 주소를 적어주세요. ... 안내 드립니다.:" 처럼
 *    라벨 자체가 문장인 경우가 여기 해당한다.
 */
function field(text: string, label: string): string {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const idx = lines[i].indexOf(label);
        if (idx === -1) continue;

        const rest = lines[i].slice(idx + label.length);
        // 라벨 바로 뒤에 콜론이 오면 같은 줄이 값이다. 값이 콜론으로 끝나도 그대로 쓴다.
        //   Viator "Hotel Pickup: My hotel is not yet booked:" → 다음 줄로 넘어가면 안 된다.
        const labelled = /^\s*[:：]/.test(rest);

        let v = rest.replace(/^[\s:：]+/, '').trim();
        // 콜론 없이 문장이 이어지다 ":" 로 끝나면 라벨이 다음 줄로 넘어간 형태다.
        //   클룩 "숙박하시는 호텔 주소를 적어주세요. … 안내 드립니다.:"
        if (!labelled && /[:：]$/.test(v)) v = '';
        if (v) return v;

        for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim()) return lines[j].trim();
        }
    }
    return '';
}

/**
 * 라벨 **다음 줄**의 값을 뽑는다. GYG 변경 메일 전용.
 * 라벨 줄에 `New` 배지가 붙어 오므로("Pickup location New") 그건 값으로 치지 않는다.
 */
function valueAfterLabel(text: string, label: string): string {
    const lines = text.split('\n');
    const i = lines.findIndex((l) => l.includes(label));
    if (i === -1) return '';

    const rest = lines[i].slice(lines[i].indexOf(label) + label.length)
        .replace(/^[\s:：]+/, '').replace(/^New\b/i, '').trim();
    if (rest) return rest;

    for (let j = i + 1; j < lines.length; j++) {
        const v = lines[j].trim();
        if (v && !/^New$/i.test(v)) return v;
    }
    return '';
}

const pad = (n: number | string) => String(n).padStart(2, '0');

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * 네 플랫폼 날짜 표기를 전부 YYYY-MM-DD 로.
 *   "2026-09-18" / "2026.10.03(토)" / "September 25, 2026" / "Tue, Sep 08, 2026"
 */
export function parseOtaDate(s: string): string {
    let m = s.match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
    if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

    m = s.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) {
        const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
        if (mi >= 0) return `${m[3]}-${pad(mi + 1)}-${pad(m[2])}`;
    }
    return '';
}

/**
 * 시각 → 1부/2부/3부.
 *
 * 플랫폼마다 싣는 시각의 의미가 다르다.
 *   tour_settings 출항 시각 : 08:00 / 11:00 / 15:00
 *   픽업 시각(클룩·Viator)  : 07:30 / 10:30 / 15:30
 * 그래서 경계를 **10시와 14시**에 둔다. 출항 시각이 와도 픽업 시각이 와도 같은 부로 떨어진다.
 *   07:30·08:00 → 1부 / 10:30·11:00 → 2부 / 14:30·15:00·15:30 → 3부
 *
 * 여기어때는 옵션명이 "1부, 2부 ... / ... 크루즈 07:30" 처럼 그룹명 전체라
 * 앞의 "1부/2부" 를 믿으면 안 되고 맨 뒤 시각을 봐야 한다.
 */
export function optionFromTime(text: string): string {
    const m = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return '';

    let h = Number(m[1]);
    const mer = m[3]?.toUpperCase();
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;

    if (h < 10) return '1부';
    if (h < 14) return '2부';
    return '3부';
}

/** "2 x 1부(...) 성인", "4 x Adults (Age 8-99)" 형태. total 은 성인/아동 구분이 없을 때를 위한 총원. */
function paxFromXForm(v: string): { adult: number; child: number; total: number } {
    let adult = 0;
    let child = 0;
    for (const m of v.matchAll(/(\d+)\s*x\s*([^,;]*)/gi)) {
        const n = Number(m[1]);
        if (/아동|소아|child/i.test(m[2])) child += n;
        else adult += n;
    }
    // 변경 메일은 "2" 처럼 총원만 온다. 성인/아동 구분이 없으니 성인으로 세지 않는다.
    if (adult + child === 0) {
        const total = Number(v.match(/\d+/)?.[0] || 0);
        return { adult: 0, child: 0, total };
    }
    return { adult, child, total: adult + child };
}

const paxLabel = (adult: number, child: number) => `${adult + child}명`;

/** "(Alternate Phone)AU+61 0478 174 157 Send the customer a message." → "+61 0478 174 157" */
function phoneOf(v: string): string {
    return v.match(/\+?\d[\d\s\-().]{5,}\d/)?.[0].trim() || '';
}

const clean = (v: string) => (v === '()' || v === '-' || v === 'NA' ? '' : v);

// ============================================================
// 플랫폼 판별 · 신규/취소 판별
// ============================================================

export function detectPlatform(from: string, subject: string): OtaPlatform | null {
    const s = `${from} ${subject}`.toLowerCase();
    if (s.includes('klook') || s.includes('클룩')) return 'klook';
    if (s.includes('getyourguide')) return 'gyg';
    if (s.includes('viator')) return 'viator';
    if (s.includes('yeogi') || s.includes('goodchoice') || s.includes('여기어때')) return 'yeogi';
    return null;
}

/**
 * 취소 메일인지. 판정은 제목 기준(본문의 "cancellation policy" 오탐 회피).
 * Viator 만 본문 "Booking Canceled" 를 보조로 본다.
 * 여기어때는 취소 메일 샘플이 없어서 이번 범위 밖 → null 을 돌려 파싱 실패시킨다.
 */
function detectKind(platform: OtaPlatform, subject: string, text: string): OtaEmailKind | null {
    switch (platform) {
        case 'klook':
            // "클룩 부분 취소" 는 제목에 '예약' 이 없다. 전체 취소보다 먼저 봐야 한다.
            if (/부분\s*취소/.test(subject)) return 'partial_cancel';
            return /Klook Canceled|예약\s*취소/i.test(subject) ? 'cancel' : 'new';
        case 'viator':
            // 제목이 "Cancelled Booking" 과 "Canceled Booking" 두 철자로 온다.
            return /Cancell?ed Booking/i.test(subject) || /Booking Cancell?ed/i.test(text) ? 'cancel' : 'new';
        case 'gyg':
            // "Booking detail change: - S… - GYG…" 는 기존 예약의 픽업/인원/날짜가 바뀐 것이다.
            // 신규로 오인하면 가짜 예약이 하나 더 생긴다.
            if (/detail change/i.test(subject)) return 'update';
            // "GYG… was cancelled" 와 "A booking has been canceled - S… - GYG…" 두 가지로 온다.
            return /was cancelled|has been canceled/i.test(subject) ? 'cancel' : 'new';
        case 'yeogi':
            // 취소 메일 포맷 미확인. "확정" 메일만 처리하고 나머지는 안읽음으로 남긴다.
            return /확정/.test(subject) ? 'new' : null;
    }
}

// ============================================================
// 플랫폼별 파서
// ============================================================

type ParsedFields = Omit<OtaBooking, 'kind' | 'platform' | 'source'>;

function parseKlook(text: string): ParsedFields | null {
    // 실제 예약번호는 TAH479224 / BER991379 처럼 영문 3 + 숫자 6 이다.
    const orderId = field(text, '예약 확인 ID') || text.match(/\b[A-Z]{3}\d{6}\b/)?.[0] || '';
    const tourDate = parseOtaDate(field(text, '요청 날짜'));
    if (!orderId || !tourDate) return null;

    const first = clean(field(text, '영문 이름'));
    const last = clean(field(text, '영문 성'));
    // 성/이름에 같은 값을 적어 보내는 손님이 있다. "조용진 조용진" 이 되지 않게 한 번 거른다.
    const name = (first && first === last ? first : [first, last].filter(Boolean).join(' '))
        || clean(field(text, '대표 예약자명'));

    // 부분 취소 메일에는 '여행자' 가 없고 '취소된 수량' / '남은 수량' 으로 온다.
    // 이때 인원·옵션은 **남은 수량** 기준이어야 한다.
    const cancelledQty = clean(field(text, '취소된 수량'));
    const travelers = field(text, '여행자') || clean(field(text, '남은 수량'));
    const { adult, child } = paxFromXForm(travelers);

    const kakao = clean(field(text, '카카오톡'));
    const pkg = clean(field(text, '패키지'));

    return {
        orderId,
        name,
        tourDate,
        option: optionFromTime(travelers),
        pax: paxLabel(adult, child),
        adultCount: adult,
        childCount: child,
        pickupLocation: clean(field(text, '숙박하시는 호텔 주소')),
        contact: phoneOf(field(text, '전화번호')) || phoneOf(field(text, '대표 예약자 핸드폰 번호')),
        bookerEmail: clean(field(text, '대표 예약자 이메일 주소')),
        note: [pkg && `패키지: ${pkg}`, kakao && `카톡: ${kakao}`, cancelledQty && `취소수량: ${cancelledQty}`]
            .filter(Boolean).join(' / '),
    };
}

function parseGyg(text: string): ParsedFields | null {
    const orderId = field(text, 'Reference number') || text.match(/GYG[A-Z0-9]{6,}/)?.[0] || '';
    if (!orderId) return null;

    // 신규·취소 메일 모두 "Date:" 로 투어 일시가 온다.
    const dateLine = field(text, 'Date');
    const tourDate = parseOtaDate(dateLine);
    if (!tourDate) return null;

    const participants = field(text, 'Number of participants');
    const { adult, child } = paxFromXForm(participants);

    const lang = clean(field(text, 'Tour language'));
    const price = clean(field(text, 'Price'));
    const reason = clean(field(text, 'Cancellation reason'));

    // 신규 메일은 이름·이메일·전화·언어가 공백 없이 한 줄로 붙어서 온다.
    //   "Goldie Shao customer-xxxx@reply.getyourguide.comPhone: +8618939095177Language: English"
    const blob = field(text, 'Main customer');
    const [head, phoneTail = ''] = blob.split(/Phone:/);
    const emailAt = head.match(/[\w.+-]+@[\w.-]+/);
    const emailPart = emailAt?.[0] ?? '';
    const namePart = emailAt ? head.slice(0, emailAt.index) : head;

    return {
        orderId,
        // 'Customer' 는 "Customer hasn't specified a pickup location…" 같은 안내 문장에도 걸린다.
        // 라벨 형태("Customer: 이름")일 때만 쓴다.
        name: clean(namePart.trim()) || (text.match(/^Customer:\s*(.+)$/m)?.[1]?.trim() ?? ''),
        tourDate,
        option: optionFromTime(dateLine),
        pax: paxLabel(adult, child),
        adultCount: adult,
        childCount: child,
        // "…, Honolulu, HI 96815, USA Open in Google Maps" 에서 링크 문구를 떼어 낸다.
        pickupLocation: clean(field(text, 'Pickup')).replace(/\s*Open in Google Maps\s*$/i, '').trim(),
        contact: phoneOf(phoneTail) || phoneOf(field(text, 'Phone')),
        bookerEmail: emailPart.trim() || text.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || '',
        note: [lang && `언어: ${lang}`, price && `금액: ${price}`, reason && `취소사유: ${reason}`]
            .filter(Boolean).join(' / '),
    };
}

/**
 * GYG "Booking detail change" — 기존 예약의 픽업/인원/날짜가 바뀐 메일.
 *
 * 바뀐 항목의 라벨 뒤에 `New` 배지가 붙고, **새 값이 먼저, 취소선 친 옛 값이 그 다음** 줄에 온다.
 *   Pickup location New
 *   The Buffet At Hyatt, 2424 Kalākaua Ave, …      ← 새 값
 *   (coordinates: 21.2763612, -157.8250235)
 *   Open in Google MapsCustomer hasn't specified…  ← 옛 값(취소선)
 * 그래서 라벨 다음의 첫 줄만 본다.
 */
function parseGygUpdate(text: string): ParsedFields | null {
    const orderId = field(text, 'Booking reference') || text.match(/GYG[A-Z0-9]{6,}/)?.[0] || '';
    const dateLine = valueAfterLabel(text, 'Date');
    const tourDate = parseOtaDate(dateLine);
    if (!orderId || !tourDate) return null;

    const pickup = valueAfterLabel(text, 'Pickup location')
        .replace(/\(coordinates:[^)]*\)/i, '')
        .replace(/Open in Google Maps.*$/i, '')
        .trim();

    const total = Number(valueAfterLabel(text, 'Number of participants').match(/\d+/)?.[0] || 0);
    const lang = valueAfterLabel(text, 'Language');

    return {
        orderId,
        name: '',                       // 변경 메일에는 고객명이 없다. 기존 행의 이름을 유지한다.
        tourDate,
        option: optionFromTime(dateLine),
        pax: total ? `${total}명` : '',
        adultCount: 0,                  // 총원만 오고 성인/아동 구분이 없다 (§ 호출부에서 덮어쓰지 않는다)
        childCount: 0,
        pickupLocation: pickup,
        contact: '',
        bookerEmail: '',
        note: lang ? `언어: ${lang}` : '',
    };
}

function parseViator(text: string): ParsedFields | null {
    const orderId = text.match(/BR-\d+/)?.[0] || '';
    const tourDate = parseOtaDate(field(text, 'Travel Date'));
    if (!orderId || !tourDate) return null;

    const travelers = field(text, 'Travelers');
    const adult = Number(travelers.match(/(\d+)\s*Adult/i)?.[1] || 0);
    const child = Number(travelers.match(/(\d+)\s*(?:Child|Infant)/i)?.[1] || 0);

    // 신규는 "Tour Grade", 취소는 "Tour Option" 으로 온다.
    // 셋 중 하나에만 시각이 붙어 오는 경우가 있어서 (`TG1` vs `TG1~10:30`) 전부 이어 붙인다.
    // 세 줄 다 시각이 없는 예약도 실제로 있다 → option 은 공란으로 두고 운영자가 채운다.
    const grade = [field(text, 'Tour Grade Code'), field(text, 'Tour Grade'), field(text, 'Tour Option')]
        .filter(Boolean).join(' ');

    const lang = clean(field(text, 'Tour Language'));
    const rate = clean(field(text, 'Net Rate'));

    return {
        orderId,
        name: clean(field(text, 'Lead Traveler Name')),
        tourDate,
        option: optionFromTime(grade),
        pax: paxLabel(adult, child),
        adultCount: adult,
        childCount: child,
        pickupLocation: clean(field(text, 'Hotel Pickup')),
        // "(Alternate Phone)AU+61 0478 174 157 Send the customer a message." 에서 번호만.
        contact: phoneOf(field(text, 'Phone')),
        bookerEmail: '',
        note: [lang && `언어: ${lang}`, rate && `요금: ${rate}`].filter(Boolean).join(' / '),
    };
}

function parseYeogi(text: string): ParsedFields | null {
    // 예약번호 필드가 따로 없다. 예약확인 URL 끝 토큰이 예약번호.
    const url = text.match(/https?:\/\/\S*reservation\/detail\/([A-Za-z0-9]+)/);
    const orderId = url?.[1] || '';
    const tourDate = parseOtaDate(field(text, '이용일'));
    if (!orderId || !tourDate) return null;

    const total = field(text, '총 인원');
    const adult = Number(total.match(/성인\s*[x×]\s*(\d+)/i)?.[1] || 0);
    const child = Number(total.match(/(?:아동|소아)\s*[x×]\s*(\d+)/i)?.[1] || 0);
    const headcount = Number(total.match(/(\d+)\s*명/)?.[1] || 0);

    const product = clean(field(text, '상품'));
    const option = clean(field(text, '옵션'));

    return {
        orderId,
        // 여기어때 메일에는 고객명·연락처·픽업이 아예 없다. 운영자가 링크 열어 채운다.
        name: '(여기어때 확인필요)',
        tourDate,
        option: optionFromTime(option),
        pax: `${adult + child || headcount}명`,
        adultCount: adult,
        childCount: child,
        pickupLocation: '',
        contact: '',
        bookerEmail: '',
        note: [product && `상품: ${product}`, option && `옵션: ${option}`, url && `확인: ${url[0]}`]
            .filter(Boolean).join(' / '),
    };
}

// ============================================================
// 진입점
// ============================================================

/**
 * @returns 파싱 결과. null 이면 **호출부에서 메일을 읽음 처리하지 말 것**
 *          (다음 cron 에서 재시도되고, 안읽음으로 남아 사람 눈에 띈다)
 */
export function parseOtaEmail(html: string, subject: string, from: string): OtaBooking | null {
    const platform = detectPlatform(from, subject);
    if (!platform) return null;

    const text = htmlToText(html);
    const kind = detectKind(platform, subject, text);
    if (!kind) return null;

    const parsed =
        platform === 'klook' ? parseKlook(text)
            : platform === 'gyg' ? (kind === 'update' ? parseGygUpdate(text) : parseGyg(text))
                : platform === 'viator' ? parseViator(text)
                    : parseYeogi(text);

    if (!parsed) return null;

    // 취소·변경은 예약번호만 있으면 된다. 신규는 이름까지 필요.
    if (kind === 'new' && !parsed.name) return null;

    return { kind, platform, source: OTA_SOURCE[platform], ...parsed };
}
