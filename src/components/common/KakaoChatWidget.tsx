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
    <div className="fixed bottom-14 right-3 sm:bottom-28 sm:right-6 z-[60] animate-in slide-in-from-bottom-5 duration-500">
      <Link 
        href={chatUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="카카오톡 1:1 상담하기"
        className="group relative flex items-center justify-center w-16 h-16 bg-[#FEE500] hover:bg-[#FEE500]/90 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
      >
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
            {/* KakaoTalk Speech Bubble with "Ch" text */}
             <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Solid Brown Bubble */}
                <path fill="#3A1D1D" d="M16 4C7.163 4 0 9.73 0 16.8c0 4.54 2.846 8.528 7.228 10.758a.488.488 0 0 1 .253.5l-1.09 4.108a.56.56 0 0 0 .807.619l4.904-3.235a.519.519 0 0 1 .42-.047c1.1.309 2.26.477 3.478.477 8.837 0 16-5.73 16-12.8S24.837 4 16 4Z"/>
                {/* "Ch" Text in Yellow */}
                <text x="16" y="21.5" fill="#FEE500" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5" textAnchor="middle">Ch</text>
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
