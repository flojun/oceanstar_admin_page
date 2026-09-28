import type { Metadata } from "next";
import FaqPage from "@/components/site/faq/FaqPage";
import SiteShell from "@/components/site/SiteShell";
import { getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "자주 묻는 질문 | 오션스타 하와이 거북이 스노클링",
  description: "수영을 못해도 되나요? 아이도 탈 수 있나요? 픽업·날씨·환불까지, 오션스타 거북이 스노클링 예약 전에 가장 많이 묻는 질문을 모았습니다.",
  alternates: { canonical: "/kr/faq", languages: { "ko-KR": "/kr/faq", "en-US": "/faq", "x-default": "/faq" } },
};

export default async function Page() {
  const { tourSettings, blockedDates } = await getTourData();
  return (
    <SiteShell lang="ko" tourSettings={tourSettings} blockedDates={blockedDates}>
      <FaqPage lang="ko" tourSettings={tourSettings} />
    </SiteShell>
  );
}
