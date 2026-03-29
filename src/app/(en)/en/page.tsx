import type { Metadata } from "next";
import ReservationClientPage from "@/components/landing/ReservationClientPage";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.oceanstarhawaii.com/en",
    languages: {
      "ko-KR": "https://www.oceanstarhawaii.com",
      "en-US": "https://www.oceanstarhawaii.com/en",
    },
  },
};

export default function EnHomePage() {
  return <ReservationClientPage lang="en" />;
}
