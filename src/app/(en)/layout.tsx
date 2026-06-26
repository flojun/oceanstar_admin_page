import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oceanstarhawaii.com'),
  title: "Hawaii Turtle Snorkeling & Sunset Cruise | Ocean Star",
  description: "Highest rated in Waikiki! Hawaii turtle snorkeling, marine activities, sunset cruise, and private boat trips. Book now with Waikiki pickup included.",
  keywords: "Hawaii turtle snorkeling, Hawaii activities, Hawaii sunset cruise, Waikiki snorkeling, Ocean Star Hawaii, Hawaii private boat",
  openGraph: {
    title: "Hawaii Turtle Snorkeling & Sunset Cruise | Ocean Star",
    description: "Highest rated in Waikiki! Hawaii turtle snorkeling, marine activities, sunset cruise, and private boat trips. Book now with Waikiki pickup included.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.jpg", // 임시 이미지 URL
        width: 1200,
        height: 630,
        alt: "오션스타 하와이 거북이 스노클링 투어",
      },
    ],
  },
  verification: {
    other: {
      "naver-site-verification": [""], // 네이버 소유권 확인 토큰
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-17755406251" strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17755406251');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
