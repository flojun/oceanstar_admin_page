"use client";

import React from 'react';
import { X, CreditCard, DollarSign } from 'lucide-react';

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
  if (!isOpen) return null;

  const t = {
    ko: {
      title: "결제 통화 선택",
      subtitle: "원하시는 결제 통화를 선택해 주세요.",
      krwTitle: "한화 결제 (KRW)",
      krwDesc: "한국 신용카드 및 간편결제",
      usdTitle: "달러 결제 (USD)",
      usdDesc: "해외 신용카드 (Stripe)",
      cancel: "취소",
      krwWarning: "준비 중입니다."
    },
    en: {
      title: "Select Payment Currency",
      subtitle: "Please select your preferred payment currency.",
      krwTitle: "KRW Payment",
      krwDesc: "Korean Credit Cards & Pay",
      usdTitle: "USD Payment",
      usdDesc: "International Credit Cards (Stripe)",
      cancel: "Cancel",
      krwWarning: "Coming soon."
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{t.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-gray-600 mb-6">{t.subtitle}</p>

          <button
            onClick={onSelectKRW}
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
      </div>
    </div>
  );
}
