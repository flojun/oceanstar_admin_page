import type { Metadata } from "next";
import ManageBookingClient from "@/components/booking/ManageBookingClient";

export const metadata: Metadata = {
  title: "예약 관리",
  alternates: {
    canonical: "https://www.oceanstarhawaii.com/manage-booking",
    languages: {
      "ko-KR": "https://www.oceanstarhawaii.com/manage-booking",
      "en-US": "https://www.oceanstarhawaii.com/en/manage-booking",
    },
  },
};

export default function KoManageBookingPage() {
  return <ManageBookingClient lang="ko" />;
}
