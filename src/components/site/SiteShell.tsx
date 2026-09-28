import { Plus_Jakarta_Sans } from "next/font/google";
import type { TourSetting } from "@/lib/tourUtils";
import type { BlockedDate } from "@/lib/siteData";
import { BookingProvider } from "./BookingContext";
import type { Lang } from "./tours";
import "./site.css";

// 영문판 본문 글꼴 (캔버스 SianB_EN). 한글은 globals.css 가 부르는 Pretendard · SUIT.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

/** 리뉴얼 고객 페이지의 바깥 틀. 스타일은 .os 아래로만 적용된다. */
export default function SiteShell({
    lang,
    tourSettings,
    blockedDates,
    children,
}: {
    lang: Lang;
    tourSettings: TourSetting[];
    blockedDates: BlockedDate[];
    children: React.ReactNode;
}) {
    return (
        <div className={`os ${lang}${lang === "en" ? ` ${jakarta.variable}` : ""}`} lang={lang}>
            <BookingProvider lang={lang} tourSettings={tourSettings} blockedDates={blockedDates}>
                <main>{children}</main>
            </BookingProvider>
        </div>
    );
}
