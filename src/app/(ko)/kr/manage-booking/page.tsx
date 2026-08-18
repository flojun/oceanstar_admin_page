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
};

export default function KoManageBookingPage() {
  return <ManageBookingClient lang="ko" />;
}
