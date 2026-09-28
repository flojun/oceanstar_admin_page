import type { Metadata } from "next";
import ReviewsPage from "@/components/site/reviews/ReviewsPage";
import SiteShell from "@/components/site/SiteShell";
import { getGoogleReviews, getSiteReviews, getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Reviews | Ocean Star Hawaii Turtle Snorkeling",
  description: "Reviews from guests who booked Ocean Star turtle snorkeling in Waikiki, plus Google reviews. 15,000+ reviews across platforms.",
  alternates: { canonical: "/reviews", languages: { "ko-KR": "/kr/reviews", "en-US": "/reviews", "x-default": "/reviews" } },
};

export default async function Page() {
  const [{ tourSettings, blockedDates }, siteReviews, googleReviews] = await Promise.all([getTourData(), getSiteReviews(), getGoogleReviews()]);
  return (
    <SiteShell lang="en" tourSettings={tourSettings} blockedDates={blockedDates}>
      <ReviewsPage lang="en" tourSettings={tourSettings} siteReviews={siteReviews} googleReviews={googleReviews} />
    </SiteShell>
  );
}
