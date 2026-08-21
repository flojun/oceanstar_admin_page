/**
 * 마이리얼트립 파트너 확정대기/확정완료 이메일 HTML을 파싱하여
 * 예약 정보(예약번호, 여행자, 여행일, 옵션명, 상품명)를 추출
 *
 * 이메일 본문 구조 (두 유형 모두 동일):
 *   예약번호    EXP-20260802-00006122
 *   상품명      [내돈내산...]거북이스노클링/선셋크루즈+...
 *   옵션명      아동, 거북이 스노클링+해양 액티비티
 *   여행일      2026-08-05 ~ 2026-08-05
 *   여행자      최원철
 */

export type MRTEmailType = 'pending' | 'confirmed'; // 확정대기 | 확정완료

export interface MRTReservation {
    orderNumber: string;     // "EXP-20260802-00006122"
    productName: string;     // 상품명 전체
    optionName: string;      // "아동, 거북이 스노클링+해양 액티비티"
    tourDate: string;        // "2026-08-05" (YYYY-MM-DD)
    travelerName: string;    // "최원철"
}

export interface MRTParseResult {
    type: MRTEmailType;
    reservation: MRTReservation;
}

/**
 * 이메일 제목에서 [확정대기] / [확정완료] 구분
 */
export function detectEmailType(subject: string): MRTEmailType | null {
    if (subject.includes('[확정대기]') || subject.includes('확정대기')) return 'pending';
    if (subject.includes('[확정완료]') || subject.includes('확정완료')) return 'confirmed';
    return null;
}

/**
 * HTML 엔티티 디코딩 (간단 버전)
 */
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

/**
 * HTML 태그 제거
 */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * HTML 본문에서 "라벨: 값" 패턴으로 필드 추출
 * 마이리얼트립 이메일은 테이블 구조로 라벨-값 쌍을 표시
 */
function extractField(html: string, fieldName: string): string | null {
    // 패턴 1: <td>라벨</td> ... <td>값</td> (테이블 구조)
    const tablePattern = new RegExp(
        fieldName + '[\\s]*</(?:td|th|span|div|p|b|strong)>[\\s\\S]*?<(?:td|span|div|p)[^>]*>\\s*([\\s\\S]*?)\\s*</(?:td|span|div|p)>',
        'i'
    );
    let match = html.match(tablePattern);
    if (match) {
        return decodeHtmlEntities(stripHtml(match[1])).trim();
    }

    // 패턴 2: 라벨 뒤에 오는 텍스트 (플레인 텍스트 fallback)
    const plainPattern = new RegExp(fieldName + '[:\\s]+([^\\n<]+)', 'i');
    match = html.match(plainPattern);
    if (match) {
        return decodeHtmlEntities(match[1]).trim();
    }

    return null;
}

/**
 * 여행일 문자열에서 시작일(YYYY-MM-DD) 추출
 * "2026-08-05 ~ 2026-08-05" → "2026-08-05"
 * "2026-08-05" → "2026-08-05"
 */
function extractTourDate(dateStr: string): string | null {
    const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
}

/**
 * 예약번호 추출 (EXP-XXXXXXXX-XXXXXXXX 패턴)
 */
function extractOrderNumber(html: string): string | null {
    // EXP-20260802-00006122 패턴
    const match = html.match(/EXP-\d{8}-\d{8}/);
    if (match) return match[0];

    // 일반 필드 추출 fallback
    return extractField(html, '예약번호');
}

/**
 * 마이리얼트립 이메일을 파싱하여 예약 정보 추출
 * @param html 이메일 HTML 본문
 * @param subject 이메일 제목
 * @returns 파싱 결과 또는 null (파싱 실패 시)
 */
export function parseMyRealTripEmail(html: string, subject: string): MRTParseResult | null {
    const type = detectEmailType(subject);
    if (!type) return null;

    try {
        // 예약번호 추출 (필수)
        const orderNumber = extractOrderNumber(html);
        if (!orderNumber) {
            console.error('[MRT Parser] 예약번호를 찾을 수 없습니다.');
            return null;
        }

        // 여행자 이름 추출 (필수)
        const travelerName = extractField(html, '여행자');
        if (!travelerName) {
            console.error('[MRT Parser] 여행자 이름을 찾을 수 없습니다.');
            return null;
        }

        // 여행일 추출 (필수)
        const rawTourDate = extractField(html, '여행일');
        if (!rawTourDate) {
            console.error('[MRT Parser] 여행일을 찾을 수 없습니다.');
            return null;
        }
        const tourDate = extractTourDate(rawTourDate);
        if (!tourDate) {
            console.error('[MRT Parser] 여행일 날짜 형식 파싱 실패:', rawTourDate);
            return null;
        }

        // 옵션명 추출 (선택, 없으면 빈 문자열)
        const optionName = extractField(html, '옵션명') || '';

        // 상품명 추출 (선택, 없으면 빈 문자열)
        const productName = extractField(html, '상품명') || '';

        return {
            type,
            reservation: {
                orderNumber,
                productName,
                optionName,
                tourDate,
                travelerName,
            },
        };
    } catch (error) {
        console.error('[MRT Parser] 파싱 중 오류:', error);
        return null;
    }
}
