import type { Metadata } from "next";
import ManageBookingClient from "@/components/booking/ManageBookingClient";

export const metadata: Metadata = {
  title: "Manage Booking",
  alternates: {
    canonical: "https://www.oceanstarhawaii.com/en/manage-booking",
    languages: {
      "ko-KR": "https://www.oceanstarhawaii.com/manage-booking",
      "en-US": "https://www.oceanstarhawaii.com/en/manage-booking",
    },
  },
};

export default function EnManageBookingPage() {
  return <ManageBookingClient lang="en" />;
}
