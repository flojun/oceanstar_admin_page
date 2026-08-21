import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "맛집 추천",
  alternates: {
    canonical: "/kr/restaurants",
    languages: {
      "ko-KR": "/kr/restaurants",
      "en-US": "/restaurants",
      "x-default": "/restaurants",
    },
  },
  openGraph: {
    title: "맛집 추천 | 하와이 거북이 스노클링 예약 오션스타",
    description: "와이키키 최고 평점! 하와이 거북이 스노클링, 해양 액티비티, 선셋 크루즈, 프라이빗 보트 대관까지. 와이키키 픽업 포함, 지금 바로 실시간 예약하세요.",
    type: "website",
    url: "/kr/restaurants",
    locale: "ko_KR",
    images: ["/og-image.jpg"],
  },
};

export default function KoRestaurantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
