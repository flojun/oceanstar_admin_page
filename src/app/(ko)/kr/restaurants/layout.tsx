import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "하와이 맛집 추천 | 오션스타 하와이",
  description: "오션스타 크루가 직접 다녀온 하와이 맛집을 모았습니다. 거북이 스노클링 전후로 들르기 좋은 곳을 골라 보세요.",
  alternates: {
    canonical: "/kr/restaurants",
    languages: {
      "ko": "/kr/restaurants",
      "en": "/restaurants",
      "x-default": "/restaurants",
    },
  },
  openGraph: {
    title: "하와이 맛집 추천 | 오션스타 하와이",
    description: "오션스타 크루가 직접 다녀온 하와이 맛집을 모았습니다. 거북이 스노클링 전후로 들르기 좋은 곳을 골라 보세요.",
    type: "website",
    url: "/kr/restaurants",
    locale: "ko_KR",
    images: ["/og-image.jpg"],
  },
};

export default function KoRestaurantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
