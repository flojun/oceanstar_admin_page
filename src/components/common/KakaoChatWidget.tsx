'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, Instagram } from 'lucide-react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    HubSpotConversations?: {
      widget: {
        load: () => void;
        open: () => void;
        close: () => void;
        status: () => { loaded: boolean };
      };
    };
    hsConversationsOnReady?: Array<() => void>;
  }
}

export default function KakaoChatWidget() {
  const pathname = usePathname();

  // Hide on agency pages and admin dashboard
  if (pathname?.startsWith('/agency-') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/login')) {
    return null;
  }

  const kakaoChannelId = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID || '_hzxeEn';

  const chatOpenedRef = React.useRef(false);

  // HubSpot 기본 런처 아이콘 숨기기
  // loadImmediately: false로 설정했으므로 기본 런처가 표시되지 않지만,
  // 혹시 모를 잔여 컨테이너도 숨깁니다.
  React.useEffect(() => {
    const hideHubspotLauncher = () => {
      // 채팅이 열린 상태면 숨기지 않음
      if (chatOpenedRef.current) return;

      const container = document.getElementById('hubspot-messages-iframe-container');
      if (container) {
        container.style.setProperty('display', 'none', 'important');
      }
    };

    const intervalId = setInterval(hideHubspotLauncher, 300);
    setTimeout(() => clearInterval(intervalId), 15000);

    return () => clearInterval(intervalId);
  }, []);

  const handleHubspotChat = () => {
    // 채팅 열림 상태 표시 → interval이 더 이상 숨기지 않음
    chatOpenedRef.current = true;

    // 컨테이너를 다시 보이게 한 뒤 로드 및 열기
    const container = document.getElementById('hubspot-messages-iframe-container');
    if (container) {
      container.style.setProperty('display', 'initial', 'important');
      container.style.setProperty('bottom', '80px', 'important');
    }

    if (window.HubSpotConversations) {
      window.HubSpotConversations.widget.load();
      window.HubSpotConversations.widget.open();
    }
  };

  if (!kakaoChannelId) {
    return null;
  }

  const chatUrl = `http://pf.kakao.com/${kakaoChannelId}`;

  return (
    <div
      className="fixed z-[60] flex flex-col items-center gap-3 animate-in slide-in-from-bottom-5 duration-500"
      style={{ bottom: '100px', right: '16px' }}
    >

      {/* Instagram Button */}
      <Link
        href="https://www.instagram.com/oceanstar_turtlesnorkelling?igsh=dG8zMDZxczF2Z2t1"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="인스타그램 DM 문의하기"
        className="group relative flex items-center justify-center w-[60px] h-[60px] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
        style={{
          background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)'
        }}
      >
        <Instagram size={32} className="text-white" />

        {/* Hover Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
          <div className="bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg whitespace-nowrap flex items-center gap-2">
            <Instagram size={16} /> 인스타그램 DM 문의
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </div>
      </Link>

      {/* KakaoTalk Button */}
      <Link
        href={chatUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="카카오톡 1:1 상담하기"
        className="group relative flex items-center justify-center w-[60px] h-[60px] bg-[#FEE500] hover:bg-[#FEE500]/90 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
      >
        <svg viewBox="-2 -2 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[68%] h-[68%] ml-[1px]">
           <path fill="#3A1D1D" d="M20 5C8.954 5 0 12.163 0 21.001c0 5.676 3.558 10.66 9.035 13.447a.61.61 0 0 1 .316.626l-1.363 5.135a.701.701 0 0 0 1.01.774l6.13-4.044a.648.648 0 0 1 .524-.059c1.376.386 2.825.596 4.348.596 11.046 0 20-7.163 20-16.002C40 12.163 31.046 5 20 5Z"/>
           <text x="20" y="27" fill="#FEE500" fontSize="16" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5" textAnchor="middle">Ch</text>
        </svg>

        {/* Hover Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
          <div className="bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg whitespace-nowrap flex items-center gap-2">
            <MessageCircle size={16} /> 1:1 카카오톡 상담
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </div>
      </Link>

      {/* HubSpot Chat Button (커스텀) */}
      <button
        onClick={handleHubspotChat}
        aria-label="라이브 채팅 문의하기"
        className="group relative flex items-center justify-center w-[60px] h-[60px] bg-[#0a9ddd] hover:bg-[#0889c4] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 cursor-pointer"
      >
        <MessageCircle size={28} className="text-white" />

        {/* Hover Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
          <div className="bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg whitespace-nowrap flex items-center gap-2">
            <MessageCircle size={16} /> 라이브 채팅 문의
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </div>
      </button>
    </div>
  );
}
