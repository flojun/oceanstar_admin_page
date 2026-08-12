import type { Metadata } from "next";
import ReservationClientPage from "@/components/landing/ReservationClientPage";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.oceanstarhawaii.com/kr",
    languages: {
      "ko-KR": "https://www.oceanstarhawaii.com/kr",
      "en-US": "https://www.oceanstarhawaii.com",
    },
  },
};

export default function KoHomePage() {
  return <ReservationClientPage lang="ko" />;
}
