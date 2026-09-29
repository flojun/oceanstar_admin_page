import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 로그인·결제·체크인·예약완료는 손님 개인 화면이라 검색에 띄울 이유가 없다
      disallow: ['/api/', '/dashboard/', '/login', '/agency-', '/checkin', '/pay/', '/booking/', '/kr/booking/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
