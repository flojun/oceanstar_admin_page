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
  openGraph: {
    title: "Manage Booking | Ocean Star",
    description: "Highest rated in Waikiki! Hawaii turtle snorkeling, marine activities, sunset cruise, and private boat trips. Book now with Waikiki pickup included.",
    type: "website",
    url: "/manage-booking",
    locale: "en_US",
    images: ["/og-image.jpg"],
  },
};

export default function EnManageBookingPage() {
  return <ManageBookingClient lang="en" />;
}
