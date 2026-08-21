import type { Metadata } from "next";
import ReservationClientPage from "@/components/landing/ReservationClientPage";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/kr",
      "en-US": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "Hawaii Turtle Snorkeling & Sunset Cruise | Ocean Star",
    description: "Highest rated in Waikiki! Hawaii turtle snorkeling, marine activities, sunset cruise, and private boat trips. Book now with Waikiki pickup included.",
    type: "website",
    url: "/",
    locale: "en_US",
    images: ["/og-image.jpg"],
  },
};

export default function EnHomePage() {
  return <ReservationClientPage lang="en" />;
}
