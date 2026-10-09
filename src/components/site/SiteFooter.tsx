import Link from "next/link";
import { Arrow, Clock, Fork, Instagram, Kakao, Pin } from "./Icons";
import { EXTERNAL, links } from "./links";
import { GOOGLE_SUMMARY } from "./siteConfig";
import type { Lang } from "./tours";

// 다른 화면과 같은 기준으로 적는다: 통합 누적 15,000+, 구글은 실제 개수를 백 단위로 내림
const googleN = (Math.floor(GOOGLE_SUMMARY.count / 100) * 100).toLocaleString("en-US");

const T = {
    ko: {
        h: "지금 바다로 나가 볼까요",
        p: "함께 즐기는 그룹 스노클링부터 우리 가족만의 프라이빗 투어까지, 오션스타와 함께하세요.",
        ig: "인스타그램으로 문의하기", kakao: "카카오톡 채널로 문의하기", food: "직접 방문한 하와이 맛집 추천",
        brand: ["하와이 한인 최초 거북이 스노클링 원조.", `업계 통합 누적 리뷰 15,000+ · 구글 리뷰 ${googleN}+.`],
        hoursH: "영업시간 · 연락처", hours: "하와이 현지 기준 월~토 09:00~17:00", phone: "8083081792",
        whereH: "위치", map: "구글 지도로 바로보기",
        bizH: "사업자 정보", biz: ["상호명: Oceanview Activity LLC", "사업장 소재지: 615 PIKOI ST. STE 811", "사업자 전화번호: 8083081792"],
        // 국내 판매대행 사업자. 네이버 검색광고 검수가 광고주(알로하 하와이)와 사이트 표기를 맞춰 보기 때문에 함께 싣는다
        bizKrH: "국내 판매대행", bizKr: ["상호명: 알로하 하와이", "대표자: 정칠성", "사업자등록번호: 765-23-01629", "사업장 소재지: 경기도 안양시 만안구 양화로135번길 29, 3층"],
        logo: "오션스타",
    },
    en: {
        h: "Ready to get on the water?",
        p: "From a shared boat with travelers from everywhere to a private charter for your family alone.",
        ig: "Ask us on Instagram", kakao: "Ask us on KakaoTalk", food: "Where we eat in Honolulu",
        brand: ["Turtle snorkeling out of Kewalo Basin since 2019.", `15,000+ reviews across platforms, ${googleN}+ on Google.`],
        hoursH: "Hours and contact", hours: "Mon to Sat, 09:00-17:00 (HST)", phone: "+1 808-308-1792",
        whereH: "Where to find us", map: "Open in Google Maps",
        bizH: "Business details", biz: ["Company: Oceanview Activity LLC", "Registered address: 615 Pikoi St, Ste 811", "Phone: +1 808-308-1792"],
        bizKrH: "", bizKr: [] as string[],
        logo: "Oceanstar",
    },
};

/** end: 상세 페이지의 맺음 띠(제목 + 예약 버튼). 없으면 메인의 문의 버튼 묶음을 쓴다. */
export default function SiteFooter({ lang, end }: { lang: Lang; end?: { h2: string; sub: string; button: React.ReactNode } }) {
    const t = T[lang];
    const L = links(lang);
    return (
        <footer className="foot">
            {end ? (
                <div className="end rise">
                    <h2 dangerouslySetInnerHTML={{ __html: end.h2 }} />
                    <p dangerouslySetInnerHTML={{ __html: end.sub }} />
                    {end.button}
                </div>
            ) : (
                <div className="foot-sub rise">
                    <div>
                        <h2>{t.h}</h2>
                        <p>{t.p}</p>
                    </div>
                    <div className="sub-r">
                        <a href={EXTERNAL.instagram} className="ct ct-ig" target="_blank" rel="noopener noreferrer"><Instagram /> {t.ig}</a>
                        <a href={EXTERNAL.kakaoChannel} className="ct ct-kakao" target="_blank" rel="noopener noreferrer"><Kakao /> {t.kakao}</a>
                        <Link href={L.restaurants} className="ct ct-food"><Fork /> {t.food}</Link>
                    </div>
                </div>
            )}
            <div className="cols rise">
                <div className="c-brand">
                    <img src="/renewal/logo_full.png" alt={t.logo} className="f-logo" width={44} height={42} loading="lazy" />
                    <p>{t.brand[0]}<br />{t.brand[1]}</p>
                </div>
                <div>
                    <span className="c-h"><Clock size={15} /> {t.hoursH}</span>
                    <p>{t.hours}</p>
                    <p><a href="mailto:hioceanstar@gmail.com">hioceanstar@gmail.com</a></p>
                    <p><a href="tel:+18083081792">{t.phone}</a></p>
                </div>
                <div>
                    <span className="c-h"><Pin size={15} /> {t.whereH}</span>
                    <p>1125 Kewalo Basin Harbor,<br />Gate D #110, Honolulu, HI 96814</p>
                    <a href={EXTERNAL.googleMaps} className="fmore" target="_blank" rel="noopener noreferrer">{t.map} <Arrow size={14} /></a>
                </div>
                <div>
                    <span className="c-h">{t.bizH}</span>
                    {t.biz.map((x) => <p key={x}>{x}</p>)}
                    {t.bizKr.length > 0 && (
                        <>
                            <span className="c-h" style={{ marginTop: 14 }}>{t.bizKrH}</span>
                            {t.bizKr.map((x) => <p key={x}>{x}</p>)}
                        </>
                    )}
                </div>
            </div>
            <div className="f-bot">
                <span>© {new Date().getFullYear()} Ocean Star. All Rights Reserved.</span>
            </div>
        </footer>
    );
}
