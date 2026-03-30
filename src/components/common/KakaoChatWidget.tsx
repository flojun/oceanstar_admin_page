'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function KakaoChatWidget() {
  // `.env.local`이나 Vercel 환경 변수가 없을 경우를 대비하여 하드코딩된 fallback 아이디를 제공합니다.
  const kakaoChannelId = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID || '_hzxeEn';

  if (!kakaoChannelId) {
    return null; // Don't render until ID is provided in .env
  }

  // 데스크탑 환경에서 /chat 엔드포인트는 "상담 시작을 알리는 메세지가 발송되었습니다"라는
  // 중간 페이지를 띄우고 앱 구동을 강제하므로, 채널 홈으로 연결하는 것이 훨씬 직관적입니다.
  const chatUrl = `http://pf.kakao.com/${kakaoChannelId}`;

  return (
    <div className="fixed bottom-28 right-6 z-[60] animate-in slide-in-from-bottom-5 duration-500">
      <Link 
        href={chatUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="카카오톡 1:1 상담하기"
        className="group relative flex items-center justify-center w-16 h-16 bg-[#FEE500] hover:bg-[#FEE500]/90 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
      >
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
            {/* Custom Kakao SVG Logo matching the styling standard */}
             <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.477 3 2 6.551 2 10.93c0 2.805 1.764 5.27 4.475 6.643-.189.7-.68 2.522-.781 2.923-.122.483.175.474.37.339.155-.107 2.454-1.63 3.473-2.327A11.088 11.088 11.088 0 0 0 12 18.861c5.523 0 10-3.551 10-7.93C22 6.551 17.523 3 12 3z" fill="#3A1D1D"/>
            </svg>
        </div>

        {/* Hover Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
          <div className="bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg whitespace-nowrap flex items-center gap-2">
            <MessageCircle size={16} /> 1:1 카카오톡 상담
            {/* Small arrow pointing right */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </div>
      </Link>
    </div>
  );
}
