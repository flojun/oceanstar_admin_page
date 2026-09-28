import type { Metadata } from "next";
import ManagePage from "@/components/site/manage/ManagePage";
import SiteShell from "@/components/site/SiteShell";
import { getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Manage Booking",
  alternates: {
    canonical: "/manage-booking",
    languages: {
      "ko-KR": "/kr/manage-booking",
      "en-US": "/manage-booking",
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
