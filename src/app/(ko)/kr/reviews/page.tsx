import type { Metadata } from "next";
import ReviewsPage from "@/components/site/reviews/ReviewsPage";
import SiteShell from "@/components/site/SiteShell";
import { getGoogleReviews, getSiteReviews, getTourData } from "@/lib/siteData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "고객 후기 | 오션스타 하와이 거북이 스노클링",
  description: "오션스타에서 예약하고 다녀오신 분들이 남긴 후기와 구글 리뷰를 모았습니다. 업계 통합 누적 리뷰 15,000+.",
  alternates: { canonical: "/kr/reviews", languages: { "ko-KR": "/kr/reviews", "en-US": "/reviews", "x-default": "/reviews" } },
};

export default async function Page() {
  const [{ tourSettings, blockedDates }, siteReviews, googleReviews] = await Promise.all([getTourData(), getSiteReviews(), getGoogleReviews()]);
  return (
    <SiteShell lang="ko" tourSettings={tourSettings} blockedDates={blockedDates}>
      <ReviewsPage lang="ko" tourSettings={tourSettings} siteReviews={siteReviews} googleReviews={googleReviews} />
    </SiteShell>
  );
}
