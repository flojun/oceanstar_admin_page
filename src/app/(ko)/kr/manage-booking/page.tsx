import type { Metadata } from "next";
import ManageBookingClient from "@/components/booking/ManageBookingClient";

export const metadata: Metadata = {
  title: "예약 관리",
  alternates: {
    canonical: "/kr/manage-booking",
    languages: {
      "ko-KR": "/kr/manage-booking",
      "en-US": "/manage-booking",
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

export default function KoManageBookingPage() {
  return <ManageBookingClient lang="ko" />;
}
