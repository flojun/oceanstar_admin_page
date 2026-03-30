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
            {/* Official KakaoTalk SVG Logo (Speech bubble with TALK cutout) */}
             <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#3A1D1D" d="M16 4C7.163 4 0 9.73 0 16.8c0 4.54 2.846 8.528 7.228 10.758a.488.488 0 0 1 .253.5l-1.09 4.108a.56.56 0 0 0 .807.619l4.904-3.235a.519.519 0 0 1 .42-.047c1.1.309 2.26.477 3.478.477 8.837 0 16-5.73 16-12.8S24.837 4 16 4Zm-9.39 9.948h3.313v1.171h-1.077v4.062H7.63v-4.062H6.61v-1.171Zm5.626 5.233H9.992c-.37-.033-.48-.276-.231-.56l1.328-1.554-1.393-3.118h1.285l.798 2.058.852-1.066v-.992h1.164v5.232h-1.16v-2.155l-1.079 1.255.68 1.46Zm3.14-5.233h1.16v4.061h1.722v1.171h-2.882v-5.232Zm5.797 2.296c0 .412.339.75.766.75s.765-.338.765-.75-.339-.75-.765-.75-.766.338-.766.75Zm.766 3.092c-1.383 0-2.522-1.229-2.522-2.71 0-1.48 1.14-2.71 2.522-2.71 1.384 0 2.523 1.23 2.523 2.71 0 1.48-1.14 2.71-2.523 2.71Zm5.051-5.388v5.232H25.83v-2.028l-1.306 2.028H23.11l1.713-2.5-1.636-2.732h1.378l1.018 1.84.03.067v-1.907h1.378Z"/>
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
