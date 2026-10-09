import type { Metadata } from "next";
import ManagePage from "@/components/site/manage/ManagePage";
import SiteShell from "@/components/site/SiteShell";
import { getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Manage Booking",
  // 예약번호로 들어오는 손님 화면이라 검색 결과에 띄우지 않는다 (링크는 따라가게 둔다)
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/manage-booking",
    languages: {
      "ko": "/kr/manage-booking",
      "en": "/manage-booking",
      "x-default": "/manage-booking",
    },
  },
  openGraph: {
    title: "Manage Booking | Ocean Star",
    description: "Highest rated in Waikiki! Hawaii turtle snorkeling, marine activities, sunset cruise, and private boat trips. Book now with Waikiki pickup included.",
    type: "website",
    url: "/manage-booking",
    locale: "en_US",
    images: ["/og-image.jpg"],
  },
};

export default async function EnManageBookingPage() {
  const { tourSettings, blockedDates } = await getTourData();
  return (
    <SiteShell lang="en" tourSettings={tourSettings} blockedDates={blockedDates}>
      <ManagePage lang="en" tourSettings={tourSettings} blockedDates={blockedDates} />
    </SiteShell>
  );
}
