import type { NextConfig } from "next";

/**
 * 미리보기 전용: PREVIEW_DATA_ORIGIN 을 주면 "읽기만 하는" 공개 API 를 그 사이트로 넘긴다.
 * 운영 DB 키 없이 화면을 띄워 보기 위한 것. 결제·후기 작성·취소 같은 쓰기 API 는 넘기지 않는다.
 * 운영 배포(Vercel)에는 이 값을 설정하지 않는다.
 */
const PREVIEW_READ_APIS = ["/api/settings", "/api/pickup", "/api/availability", "/api/google-reviews"];

/** 옛 PHP 사이트의 tourid → 지금 상품. 제목은 웹 아카이브에서 확인했다. */
const OLD_TOURS: Record<string, string> = { "1626030673": "turtle", "1626508977": "sunset", "1626509274": "private" };
const oldSite = (dir: string, p: string) => [
  ...Object.entries(OLD_TOURS).map(([id, key]) => ({
    source: `/maincontents/${dir}/oceanstartourdetail.php`,
    has: [{ type: "query" as const, key: "tourid", value: id }],
    destination: `${p}/tours/${key}`,
    permanent: true,
  })),
  { source: `/maincontents/${dir}/oceanstarfaq.php`, destination: `${p}/faq`, permanent: true },
  { source: `/maincontents/${dir}/:page*`, destination: p || "/", permanent: true },
];

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
  // 영문은 루트(/)라 /en 주소는 없다. 캔버스 초안과 옛 링크의 /en 을 받아 준다.
  // /tours, /kr/tours 는 목록 페이지가 따로 없어 메인의 투어 섹션으로 보낸다.
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
      { source: "/tours", destination: "/#tours", permanent: true },
      { source: "/kr/tours", destination: "/kr#tours", permanent: true },
      // 옛 PHP 사이트·그 다음 사이트 주소가 아직 검색에 남아 있다. 쌓인 점수를 새 주소로 넘긴다.
      // (.php 는 Vercel 방화벽이 403 으로 먼저 막으면 여기까지 오지 않는다)
      { source: "/index_kr.php", destination: "/kr", permanent: true },
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/hawaii-private-boat-charter", destination: "/tours/private", permanent: true },
      // 워드프레스 시절 주소 (서치콘솔 404 목록, 2026-09-29)
      { source: "/kr/waikiki-turtle-snorkeling-tour", destination: "/kr/tours/turtle", permanent: true },
      { source: "/kr/home", destination: "/kr", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/jp/:path*", destination: "/", permanent: true },
      ...oldSite("korean", "/kr"),
      ...oldSite("english", ""),
    ];
  },
  async rewrites() {
    const origin = process.env.PREVIEW_DATA_ORIGIN;
    return {
      beforeFiles: origin ? PREVIEW_READ_APIS.map((p) => ({ source: p, destination: `${origin}${p}` })) : [],
      // 옛 사이트가 /kr → /kr/index 로 보낸 것을 기억하는 브라우저가 있다. 여기서 /kr 로 되돌려 보내면
      // 그 브라우저는 둘 사이를 끝없이 오가므로, 이동 대신 같은 화면을 보여 준다 (canonical 은 /kr)
      afterFiles: [{ source: "/kr/index", destination: "/kr" }, { source: "/index", destination: "/" }],
      fallback: [],
    };
  },
};

export default nextConfig;
