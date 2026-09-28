/**
 * 구글 평점 · 리뷰 수의 대체값. 평소에는 Google Places API 에서 하루 한 번 읽고
 * (src/lib/siteData.ts getGoogleSummary), API 키가 없거나 호출이 실패할 때만 이 값이 보인다.
 */
export const GOOGLE_SUMMARY = {
    rating: 5.0,
    count: 5754,
    asOf: "2026-09-16",
};
