import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
