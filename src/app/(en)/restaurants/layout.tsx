import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recommended Restaurants",
  alternates: {
    canonical: "/restaurants",
    languages: {
      "ko-KR": "/kr/restaurants",
      "en-US": "/restaurants",
      "x-default": "/restaurants",
    },
  },
  openGraph: {
    title: "Recommended Restaurants | Ocean Star",
    description: "Highest rated in Waikiki! Hawaii turtle snorkeling, marine activities, sunset cruise, and private boat trips. Book now with Waikiki pickup included.",
    type: "website",
    url: "/restaurants",
    locale: "en_US",
    images: ["/og-image.jpg"],
  },
};

export default function RestaurantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
