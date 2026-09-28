import type { NextConfig } from "next";

/**
 * 미리보기 전용: PREVIEW_DATA_ORIGIN 을 주면 "읽기만 하는" 공개 API 를 그 사이트로 넘긴다.
 * 운영 DB 키 없이 화면을 띄워 보기 위한 것. 결제·후기 작성·취소 같은 쓰기 API 는 넘기지 않는다.
 * 운영 배포(Vercel)에는 이 값을 설정하지 않는다.
 */
const PREVIEW_READ_APIS = ["/api/settings", "/api/pickup", "/api/availability", "/api/google-reviews"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async rewrites() {
    const origin = process.env.PREVIEW_DATA_ORIGIN;
    if (!origin) return [];
    return {
      beforeFiles: PREVIEW_READ_APIS.map((p) => ({ source: p, destination: `${origin}${p}` })),
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
