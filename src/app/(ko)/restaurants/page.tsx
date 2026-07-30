"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, Utensils, Palmtree, MapPin, Fish, IceCream, Star, MessageSquare } from 'lucide-react';

export default function RestaurantsPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 relative overflow-hidden">
            {/* Background Image Setup (same as landing page) */}
            <div className="fixed inset-0 z-0 bg-slate-100">
                <img 
                    src="/images/backgrounds/clean_ocean.jpg" 
                    alt="Background" 
                    className="w-full h-full object-cover object-center opacity-70"
                />
            </div>

            <div className="relative z-10">
                {/* Header Section */}
                <header className="sticky top-0 z-[100] bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-300">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link 
                            href="/"
                            className="bg-white/50 hover:bg-white/80 text-sky-700 border border-white/60 p-2.5 rounded-full font-bold shadow-sm transition-all flex items-center gap-2"
                        >
                            <ChevronLeft size={20} />
                            <span className="hidden sm:inline">메인으로</span>
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-black text-sky-900 drop-shadow-sm flex-1 text-center truncate px-4">
                            오션스타 하와이 맛집 소개🌴🤙🏻
                        </h1>
                        <div className="w-10 sm:w-24"></div> {/* Spacer for alignment */}
                    </div>
                </header>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-4 py-10 pb-32">
                    
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-[40px] p-6 sm:p-8 rounded-[2rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_15px_35px_rgba(0,0,0,0.05)] border border-white/80 mb-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Star size={120} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-sky-900 mb-4 drop-shadow-sm leading-tight relative z-10">
                            오늘 즐거운 투어 되셨길 바랍니다✨<br />
                            오션스타 많이많이 추천 부탁드립니다😆😊
                        </h2>
                        <p className="text-slate-700 font-bold mb-4 bg-white/50 inline-block px-4 py-2 rounded-xl border border-white/60 shadow-sm relative z-10">
                            저희 웹사이트로 예약하시면 추가 할인 도와드리겠습니다✅🙆🏻‍♀️
                        </p>
                        <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-4 text-sky-800 font-black flex items-start sm:items-center justify-center gap-2 shadow-inner relative z-10">
                            <Info className="shrink-0 mt-0.5 sm:mt-0" size={20} />
                            <span>예약시 <span className="text-sky-600">재방문, 지인추천</span> 꼭 말씀해주세요👼🏻</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* 1. Sushi */}
                        <section className="bg-white/40 backdrop-blur-[30px] p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white/60 group hover:bg-white/50 transition-all duration-300">
                            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 border-b border-white/50 pb-4">
                                <div className="bg-blue-100/80 text-blue-600 p-2.5 rounded-xl shadow-inner border border-white/50">
                                    <Fish size={24} />
                                </div>
                                신선하고 맛있는 일식🍣🐟
                            </h2>
                            <ul className="space-y-4 font-medium text-slate-700">
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Mitch’s Fish Market & Sushi Bar</strong>
                                    로컬들이 좋아하는 스시 집
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Katsumidori Sushi Tokyo</strong>
                                    호텔 안 분위기 좋은 일식 집
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Totoya</strong>
                                    카이센동, 네기토로 맛집👍🏻
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Imana’s Tei</strong>
                                    로컬들이 좋아하는 이자카야
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Shabuya</strong>
                                    간단하게 먹기 좋은 무한 리필 샤브샤브
                                </li>
                            </ul>
                        </section>

                        {/* 2. Local */}
                        <section className="bg-white/40 backdrop-blur-[30px] p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white/60 group hover:bg-white/50 transition-all duration-300">
                            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 border-b border-white/50 pb-4">
                                <div className="bg-orange-100/80 text-orange-600 p-2.5 rounded-xl shadow-inner border border-white/50">
                                    <Palmtree size={24} />
                                </div>
                                하와이스러운 로컬 음식✨🌴
                            </h2>
                            <ul className="space-y-4 font-medium text-slate-700">
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Zippy’s</strong>
                                    하와이 로컬푸드/ 하와이의 김밥천국 (로코모코, 코리안 치킨 샐러드 추천!)
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Bogart’s</strong>
                                    하와이식 브런치!
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Haleiwa Joe‘s</strong>
                                    로컬들이 좋아하는 로컬/ 미국 음식 분위기👍🏻
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Spero Spera</strong>
                                    로컬 샌드위치 맛집 (아보카도 스테이크 샌드위치 & 아사이볼 추천!)
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Helena’s</strong>
                                    정통 하와이안 음식
                                </li>
                            </ul>
                        </section>

                        {/* 3. Waikiki */}
                        <section className="bg-white/40 backdrop-blur-[30px] p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white/60 group hover:bg-white/50 transition-all duration-300">
                            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 border-b border-white/50 pb-4">
                                <div className="bg-indigo-100/80 text-indigo-600 p-2.5 rounded-xl shadow-inner border border-white/50">
                                    <MapPin size={24} />
                                </div>
                                와이키키 맛집 추천📍
                            </h2>
                            <ul className="space-y-4 font-medium text-slate-700">
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Arancino di Mare</strong>
                                    이탈리안 맛집
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Herringbone</strong>
                                    분위기 좋은 저녁🌆
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Tsurutonton</strong>
                                    냉 명란우동 맛집, 마루카메 우동보다 맛있어요!
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Maui Breweing Co.</strong>
                                    하와이 양조장 맥주, 가성비 안주도 굳!
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Island Vintage Wine Bar</strong>
                                    와인과 맛있는 로컬식 안주
                                </li>
                            </ul>
                        </section>

                        {/* 4. Poke */}
                        <section className="bg-white/40 backdrop-blur-[30px] p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white/60 group hover:bg-white/50 transition-all duration-300">
                            <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-3 border-b border-white/50 pb-4">
                                <div className="bg-rose-100/80 text-rose-600 p-2.5 rounded-xl shadow-inner border border-white/50">
                                    <Utensils size={24} />
                                </div>
                                포케 맛집😋
                            </h2>
                            <div className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 mb-6">
                                <p className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                                    Ahi: 참치 / Salmon: 연어 / Hamachi: 방어
                                </p>
                                <p className="text-rose-600 font-black bg-rose-50/80 inline-block px-3 py-1.5 rounded-lg text-sm border border-rose-100">
                                    매콤마요 (Spicy Mayo) 와 간장 (Shoyu) 베이스 하나씩 추천!
                                </p>
                            </div>
                            <ul className="space-y-4 font-medium text-slate-700">
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Foodland Poke Bar</strong>
                                    Spicy Ahi 강추!
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Off The Hook</strong>
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Fresh Catch</strong>
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Nico’s Pier 38</strong>
                                </li>
                            </ul>
                        </section>

                        {/* 5. Dessert */}
                        <section className="bg-white/40 backdrop-blur-[30px] p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white/60 group hover:bg-white/50 transition-all duration-300">
                            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 border-b border-white/50 pb-4">
                                <div className="bg-pink-100/80 text-pink-500 p-2.5 rounded-xl shadow-inner border border-white/50">
                                    <IceCream size={24} />
                                </div>
                                디저트🍧🍭
                            </h2>
                            <ul className="space-y-4 font-medium text-slate-700">
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Match Maiko’s</strong>
                                    진하고 쌉쌀한 마차 아이스크림
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Nana’s Green Tea</strong>
                                    호지차 라떼/ 아이스크림 강추!!
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Mosa Ice Cream</strong>
                                    모찌 & 견과류 아이스크림🤍
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Coffee or Tea</strong>
                                    로컬들이 좋아하는 밀크티/ 빙수
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Leahi Health</strong>
                                    아사이볼💜
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Lanikai Juice</strong>
                                    아사이볼💜
                                </li>
                                <li className="bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 hover:-translate-y-1 transition-transform">
                                    <strong className="text-lg text-slate-900 block mb-1">Da Cove Health Bar and Cafe</strong>
                                    아사이볼💜
                                </li>
                            </ul>
                        </section>
                    </div>

                    {/* Footer / CTA */}
                    <div className="mt-12 bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] text-center border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.05)]">
                        <h3 className="text-2xl font-black text-sky-900 mb-4 drop-shadow-sm">
                            하와이에서 더더욱 맛있고 즐거운 여행 되시길 바랍니다~<br />
                            마할로!🤙🏻
                        </h3>
                        <p className="text-slate-600 font-bold mb-6">
                            더 궁금하신 점은 카톡으로 문의 주세요!
                        </p>
                        <a 
                            href="http://pf.kakao.com/_yxfcExj" 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] font-black text-lg px-8 py-4 rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95"
                        >
                            <MessageSquare className="fill-black" size={24} />
                            카톡 바로가기!
                        </a>
                    </div>

                </div>
            </div>
        </main>
    );
}
