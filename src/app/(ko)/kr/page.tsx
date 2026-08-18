import type { Metadata } from "next";
import ReservationClientPage from "@/components/landing/ReservationClientPage";

export const metadata: Metadata = {
  alternates: {
    canonical: "/kr",
    languages: {
      "ko-KR": "/kr",
      "en-US": "/",
      "x-default": "/",
    },
  },
};

export default function KoHomePage() {
  return <ReservationClientPage lang="ko" />;
}
