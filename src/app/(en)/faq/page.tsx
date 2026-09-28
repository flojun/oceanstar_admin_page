import type { Metadata } from "next";
import FaqPage from "@/components/site/faq/FaqPage";
import SiteShell from "@/components/site/SiteShell";
import { getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ | Ocean Star Hawaii Turtle Snorkeling",
  description: "Can non-swimmers join? Minimum age, pickup, weather and refunds: answers to the questions guests ask most before booking Ocean Star turtle snorkeling.",
  alternates: { canonical: "/faq", languages: { "ko-KR": "/kr/faq", "en-US": "/faq", "x-default": "/faq" } },
};

export default async function Page() {
  const { tourSettings, blockedDates } = await getTourData();
  return (
    <SiteShell lang="en" tourSettings={tourSettings} blockedDates={blockedDates}>
      <FaqPage lang="en" tourSettings={tourSettings} />
    </SiteShell>
  );
}
