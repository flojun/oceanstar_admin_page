"use client";

import React, { useEffect, useState } from 'react';
import { X, DollarSign, Landmark } from 'lucide-react';

interface CurrencySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKRW: () => void;
  onSelectUSD: () => void;
  lang: 'ko' | 'en';
}

export default function CurrencySelectModal({
  isOpen,
  onClose,
  onSelectKRW,
  onSelectUSD,
  lang
}: CurrencySelectModalProps) {
  // 한화 결제는 PG 연동 전이라 계좌이체 안내 단계를 한 번 더 거친다
  const [step, setStep] = useState<'select' | 'krwNotice'>('select');

  useEffect(() => {
    if (isOpen) setStep('select');
  }, [isOpen]);

  if (!isOpen) return null;

  const t = {
    ko: {
      title: "결제 통화 선택",
      subtitle: "원하시는 결제 통화를 선택해 주세요.",
      krwTitle: "한화 결제 (KRW)",
      krwDesc: "계좌이체 결제 (카드결제 연동 준비 중)",
      usdTitle: "달러 결제 (USD)",
      usdDesc: "해외 신용카드 (Stripe)",
      cancel: "취소",
      noticeTitle: "한화 결제 안내",
      noticeLead: "현재 한화(KRW) 카드결제는 결제시스템 연동 준비 중입니다.",
      noticeItems: [
        "예약은 '결제 대기' 상태로 접수됩니다.",
        "계좌이체(무통장 입금)를 완료하셔야 예약이 최종 확정됩니다.",
        "입금 계좌는 예약 접수 직후 카카오톡 채널로 안내드립니다.",
      ],
      noticeAsk: "이대로 예약을 진행하시겠습니까?",
      back: "뒤로",
      proceed: "예약 진행하기",
    },
    en: {
      title: "Select Payment Currency",
      subtitle: "Please select your preferred payment currency.",
      krwTitle: "KRW Payment",
      krwDesc: "Bank transfer (card payment coming soon)",
      usdTitle: "USD Payment",
      usdDesc: "International Credit Cards (Stripe)",
      cancel: "Cancel",
      noticeTitle: "About KRW Payment",
      noticeLead: "KRW card payment is not available yet — our payment gateway is still being connected.",
      noticeItems: [
        "Your booking is submitted with the status \"Awaiting payment\".",
        "It is confirmed only after your bank transfer is completed.",
        "We send the account details through our KakaoTalk channel right after your booking is received.",
      ],
      noticeAsk: "Would you like to continue with your booking?",
      back: "Back",
      proceed: "Continue booking",
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{step === 'select' ? t.title : t.noticeTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {step === 'select' ? (
          <>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 mb-6">{t.subtitle}</p>

              <button
                onClick={() => setStep('krwNotice')}
                className="w-full flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-[#1E3A8A] hover:bg-blue-50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors mr-4 shrink-0">
                  <span className="font-bold text-lg">₩</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg group-hover:text-[#1E3A8A]">{t.krwTitle}</h4>
                  <p className="text-sm text-gray-500">{t.krwDesc}</p>
                </div>
              </button>

              <button
                onClick={onSelectUSD}
                className="w-full flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-[#1E3A8A] hover:bg-blue-50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors mr-4 shrink-0">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg group-hover:text-[#1E3A8A]">{t.usdTitle}</h4>
                  <p className="text-sm text-gray-500">{t.usdDesc}</p>
                </div>
              </button>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-5">
                <Landmark size={22} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 font-medium leading-relaxed">{t.noticeLead}</p>
              </div>

              <ul className="space-y-2.5 mb-5">
                {t.noticeItems.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[15px] text-gray-700 leading-relaxed">
                    <span className="text-[#1E3A8A] font-bold shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="font-bold text-gray-800">{t.noticeAsk}</p>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setStep('select')}
                className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={onSelectKRW}
                className="px-6 py-2 rounded-lg bg-[#1E3A8A] text-white font-bold hover:bg-[#172F6E] transition-colors"
              >
                {t.proceed}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
