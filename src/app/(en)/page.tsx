import type { Metadata } from "next";
import HomePage from "@/components/site/HomePage";
import SiteShell from "@/components/site/SiteShell";
import { getGoogleReviews, getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/kr",
      "en-US": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "Hawaii Turtle Snorkeling & Sunset Cruise | Ocean Star",
    description: "Highest rated in Waikiki! Hawaii turtle snorkeling, marine activities, sunset cruise, and private boat trips. Book now with Waikiki pickup included.",
    type: "website",
    url: "/",
    locale: "en_US",
    images: ["/og-image.jpg"],
  },
};

export default async function EnHomePage() {
  const [{ tourSettings, blockedDates }, googleReviews] = await Promise.all([getTourData(), getGoogleReviews()]);
  return (
    <SiteShell lang="en" tourSettings={tourSettings} blockedDates={blockedDates}>
      <HomePage lang="en" tourSettings={tourSettings} googleReviews={googleReviews} />
    </SiteShell>
  );
}
