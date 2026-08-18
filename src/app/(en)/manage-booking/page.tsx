import type { Metadata } from "next";
import ManageBookingClient from "@/components/booking/ManageBookingClient";

export const metadata: Metadata = {
  title: "Manage Booking",
  alternates: {
    canonical: "/manage-booking",
    languages: {
      "ko-KR": "/kr/manage-booking",
      "en-US": "/manage-booking",
      "x-default": "/manage-booking",
    },
  },
};

export default function EnManageBookingPage() {
  return <ManageBookingClient lang="en" />;
}
