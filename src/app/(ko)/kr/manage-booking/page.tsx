import type { Metadata } from "next";
import ManagePage from "@/components/site/manage/ManagePage";
import SiteShell from "@/components/site/SiteShell";
import { getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "예약 관리",
  // 예약번호로 들어오는 손님 화면이라 검색 결과에 띄우지 않는다 (링크는 따라가게 둔다)
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/kr/manage-booking",
    languages: {
      "ko": "/kr/manage-booking",
      "en": "/manage-booking",
      "x-default": "/manage-booking",
    },
  },
  openGraph: {
    title: "예약 관리 | 하와이 거북이 스노클링 예약 오션스타",
    description: "와이키키 최고 평점! 하와이 거북이 스노클링, 해양 액티비티, 선셋 크루즈, 프라이빗 보트 대관까지. 와이키키 픽업 포함, 지금 바로 실시간 예약하세요.",
    type: "website",
    url: "/kr/manage-booking",
    locale: "ko_KR",
    images: ["/og-image.jpg"],
  },
};

export default async function KoManageBookingPage() {
  const { tourSettings, blockedDates } = await getTourData();
  return (
    <SiteShell lang="ko" tourSettings={tourSettings} blockedDates={blockedDates}>
      <ManagePage lang="ko" tourSettings={tourSettings} blockedDates={blockedDates} />
    </SiteShell>
  );
}
