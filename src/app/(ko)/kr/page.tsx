import type { Metadata } from "next";
import HomePage from "@/components/site/HomePage";
import SiteShell from "@/components/site/SiteShell";
import { getGoogleReviews, getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: {
    canonical: "/kr",
    languages: {
      "ko-KR": "/kr",
      "en-US": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "하와이 거북이 스노클링 & 선셋 크루즈 예약 | 오션스타 하와이",
    description: "와이키키 최고 평점! 하와이 거북이 스노클링, 해양 액티비티, 선셋 크루즈, 프라이빗 보트 대관까지. 와이키키 픽업 포함, 지금 바로 실시간 예약하세요.",
    type: "website",
    url: "/kr",
    locale: "ko_KR",
    images: ["/og-image.jpg"],
  },
};

export default async function KoHomePage() {
  const [{ tourSettings, blockedDates }, googleReviews] = await Promise.all([getTourData(), getGoogleReviews()]);
  return (
    <SiteShell lang="ko" tourSettings={tourSettings} blockedDates={blockedDates}>
      <HomePage lang="ko" tourSettings={tourSettings} googleReviews={googleReviews} />
    </SiteShell>
  );
}
