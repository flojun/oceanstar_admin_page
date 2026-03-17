import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  title: "하와이 거북이 스노클링 & 선셋 크루즈 예약 | 오션스타 하와이",
  description: "와이키키 최고 평점! 하와이 거북이 스노클링, 해양 액티비티, 선셋 크루즈, 프라이빗 보트 대관까지. 와이키키 픽업 포함, 지금 바로 실시간 예약하세요.",
  keywords: "하와이 거북이 스노클링, 하와이 액티비티, 하와이 선셋 크루즈, 와이키키 스노클링, 오션스타 하와이, 하와이 프라이빗 보트",
  openGraph: {
    title: "하와이 거북이 스노클링 & 선셋 크루즈 예약 | 오션스타 하와이",
    description: "와이키키 최고 평점! 하와이 거북이 스노클링, 해양 액티비티, 선셋 크루즈, 프라이빗 보트 대관까지. 와이키키 픽업 포함, 지금 바로 실시간 예약하세요.",
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
