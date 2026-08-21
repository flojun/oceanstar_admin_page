import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function VideoPopupModal({ lang }: { lang: 'ko' | 'en' }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 세션 스토리지 체크 (브라우저 탭을 닫기 전까지는 다시 안 뜸)
    const hasSeenPopup = sessionStorage.getItem('videoPopupSeen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('videoPopupSeen', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="absolute inset-0 z-0"
        onClick={handleClose} 
      />
      <div className="relative z-10 w-fit max-w-[95vw] md:max-w-5xl bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in-up flex flex-col">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 w-10 h-10 bg-black/50 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* 비디오 영역 */}
        <div className="relative flex justify-center bg-black">
          <video
            className="w-auto h-auto max-w-full max-h-[75vh] block"
            controls
            autoPlay
            muted
            playsInline
            src="/promo-video.mp4"
          >
            현재 브라우저에서 동영상을 지원하지 않습니다.
          </video>
        </div>

        {/* 하단 닫기 바 */}
        <div className="p-3 bg-slate-900/90 text-center border-t border-slate-800 w-full">
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            {lang === 'ko' ? '창 닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
