/**
 * 결제 완료 전환 이벤트 (Google Ads · Google 태그).
 *
 * 결제 완료 화면(/booking/payment-success)에서 Stripe 세션 확인이 끝난 직후 한 번 보낸다.
 * 같은 예약으로 두 번 세지 않도록 브라우저에 보낸 예약번호를 남기고, transaction_id 도 함께 보낸다
 * (Google Ads 가 같은 transaction_id 를 중복 제거한다).
 *
 * 라벨은 Google Ads 전환 액션 'Purchase'(2026-09-28 생성)의 이벤트 스니펫 send_to 값이다.
 * 공개 식별자(페이지 HTML 에 그대로 노출됨)라 코드에 둔다. 바꿀 때는 NEXT_PUBLIC_GADS_PURCHASE_LABEL 로 덮어쓴다.
 */
const ADS_ID = "AW-17755406251";
const PURCHASE_LABEL = "WYXwCPvglokdEKv_t5JC";

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag {
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: Gtag };
    if (w.gtag) return w.gtag;
    // 레이아웃의 태그 스크립트보다 먼저 실행돼도 잃지 않게 같은 방식으로 대기열에 넣는다
    w.dataLayer = w.dataLayer || [];
    return function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
    };
}

export function reportPurchase({ orderId, value, currency }: { orderId: string; value?: number; currency?: string }) {
    if (typeof window === "undefined" || !orderId) return;
    const key = `os-conv-${orderId}`;
    try {
        if (window.localStorage.getItem(key)) return;
        window.localStorage.setItem(key, "1");
    } catch {
        // 저장소를 못 써도 transaction_id 로 중복이 걸러진다
    }
    const g = gtag();
    const money = value !== undefined && currency ? { value, currency } : {};
    const label = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL || PURCHASE_LABEL;
    g("event", "conversion", { send_to: `${ADS_ID}/${label}`, transaction_id: orderId, ...money });
    g("event", "purchase", { transaction_id: orderId, ...money });
}
