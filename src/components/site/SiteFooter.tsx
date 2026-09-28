import Link from "next/link";
import { Arrow, Clock, Fork, Instagram, Kakao, Pin } from "./Icons";
import { EXTERNAL, links } from "./links";
import type { Lang } from "./tours";

const T = {
    ko: {
        h: "지금 바다로 나가 볼까요",
        p: "함께 즐기는 그룹 스노클링부터 우리 가족만의 프라이빗 투어까지, 오션스타와 함께하세요.",
        ig: "인스타그램으로 문의하기", kakao: "카카오톡 채널로 문의하기", food: "직접 방문한 하와이 맛집 추천",
        brand: ["하와이 한인 최초 거북이 스노클링 원조.", "여행 플랫폼 8,000 리뷰 · 구글 5,000 리뷰."],
        hoursH: "영업시간 · 연락처", hours: "하와이 현지 기준 월~토 09:00~17:00", phone: "8083081792",
        whereH: "위치", map: "구글 지도로 바로보기",
        bizH: "사업자 정보", biz: ["상호명: Oceanview Activity LLC", "사업장 소재지: 615 PIKOI ST. STE 811", "사업자 전화번호: 8083081792"],
        logo: "오션스타",
    },
    en: {
        h: "Ready to get on the water?",
        p: "From a shared boat with travelers from everywhere to a private charter for your family alone.",
        ig: "Ask us on Instagram", kakao: "Ask us on KakaoTalk", food: "Where we eat in Honolulu",
        brand: ["Turtle snorkeling out of Kewalo Basin since 2019.", "8,000 reviews across travel platforms, 5,000 on Google."],
        hoursH: "Hours and contact", hours: "Mon to Sat, 09:00-17:00 (HST)", phone: "+1 808-308-1792",
        whereH: "Where to find us", map: "Open in Google Maps",
        bizH: "Business details", biz: ["Company: Oceanview Activity LLC", "Registered address: 615 Pikoi St, Ste 811", "Phone: +1 808-308-1792"],
        logo: "Oceanstar",
    },
};

export default function SiteFooter({ lang, cta = true }: { lang: Lang; cta?: boolean }) {
    const t = T[lang];
    const L = links(lang);
    return (
        <footer className="foot">
            {cta && (
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
                    <a href={EXTERNAL.googleMaps} className="more" target="_blank" rel="noopener noreferrer">{t.map} <Arrow size={14} /></a>
                </div>
                <div>
                    <span className="c-h">{t.bizH}</span>
                    {t.biz.map((x) => <p key={x}>{x}</p>)}
                </div>
            </div>
            <div className="f-bot">
                <span>© {new Date().getFullYear()} Ocean Star. All Rights Reserved.</span>
            </div>
        </footer>
    );
}
