import type { Lang, TourKey } from "./tours";

/** 한국어는 /kr 아래, 영어는 루트. (/en 은 쓰지 않는다) */
export const prefix = (lang: Lang) => (lang === "ko" ? "/kr" : "");

export const links = (lang: Lang) => {
    const p = prefix(lang);
    return {
        home: p || "/",
        tour: (key: TourKey) => `${p}/tours/${key}`,
        reviews: `${p}/reviews`,
        reviewWrite: `${p}/reviews/write`,
        faq: `${p}/faq`,
        manage: `${p}/manage-booking`,
        restaurants: `${p}/restaurants`,
    };
};

/** 같은 페이지의 다른 언어 주소 */
export function otherLangPath(pathname: string, lang: Lang): string {
    if (lang === "ko") {
        const rest = pathname.replace(/^\/kr(?=\/|$)/, "");
        return rest || "/";
    }
    return pathname === "/" ? "/kr" : `/kr${pathname}`;
}

export const EXTERNAL = {
    googleReviews: "https://maps.google.com/?cid=4811056586202054316",
    googleMaps: "https://maps.google.com/?cid=4811056586202054316",
    instagram: "https://www.instagram.com/oceanstar_turtlesnorkelling?igsh=dG8zMDZxczF2Z2t1",
    kakaoChannel: "http://pf.kakao.com/_hzxeEn",
    kakaoChat: "http://pf.kakao.com/_yxfcExj",
    youtube: "https://www.youtube.com/watch?v=HaxDMbuuJHE",
};
