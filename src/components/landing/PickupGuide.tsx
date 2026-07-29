"use client";

import { useEffect, useState } from 'react';
import { Bus, Clock, Navigation } from 'lucide-react';
import { getPickupDisplayNameByLang } from '@/constants/pickupLocations';
import type { Language } from '@/lib/translations';

export default function PickupGuide({ lang }: { lang: Language }) {
    const [locations, setLocations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/pickup')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const sorted = data.sort((a: any, b: any) => {
                        if (a.name === '직접') return 1;
                        if (b.name === '직접') return -1;
                        return (a.time_1 || '').localeCompare(b.time_1 || '');
                    });
                    setLocations(sorted);
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    if (isLoading || locations.length === 0) return null;

    return (
        <section className="mb-20 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-[40px] p-6 sm:p-10 lg:p-12 rounded-[2.5rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_15px_35px_rgba(0,0,0,0.05)] border border-white/60 relative overflow-hidden">
            {/* Header Section */}
            <div className="text-center mb-16 relative z-10">
                <div className="inline-flex items-center justify-center bg-white/40 text-sky-700 border border-white/60 p-4 rounded-2xl mb-5 shadow-[inset_0_0_10px_rgba(255,255,255,0.8)] backdrop-blur-sm">
                    <Bus size={32} />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight drop-shadow-sm">
                    {lang === 'en' ? 'Official Pickup Route' : '오션스타 공식 픽업 노선도'}
                </h2>
                <p className="text-base text-slate-500 font-medium">
                    {lang === 'en' ? (
                        <>Enter your hotel address when booking to get the <br className="sm:hidden" /> closest pickup spot</>
                    ) : (
                        <>투어 예약시 호텔주소를 입력하시면<br className="sm:hidden" /> 가장 가까운 픽업 장소로 배정해드립니다</>
                    )}
                </p>
                <div className="mt-6 flex justify-center">
                    <p className="text-xs sm:text-sm text-slate-600 bg-white/40 font-bold px-4 py-2 border border-white/60 rounded-full shadow-sm backdrop-blur-sm">
                        {lang === 'en' ? '※ Actual times may vary by ~5 mins due to traffic.' : '※ 실제 도로 사정에 따라 5분 정도 차이가 발생할 수 있습니다.'}
                    </p>
                </div>
            </div>

            {/* Vertical Timeline Section */}
            <div className="max-w-3xl mx-auto relative z-10 mt-8 mb-4">
                {/* 1. The Vertical Background Line */}
                <div className="absolute left-[20px] md:left-1/2 top-4 bottom-4 w-1 bg-white/50 backdrop-blur-sm border-x border-white/30 md:-translate-x-1/2 rounded-full"></div>

                <div className="pt-2 pb-2">
                    {locations.map((loc, index) => {
                        // Alternate left/right on tablet/desktop
                        const isEven = index % 2 === 0;

                        return (
                            <div 
                                key={loc.id} 
                                className={`relative flex flex-col md:flex-row items-start md:items-center ${isEven ? 'md:justify-start' : 'md:justify-end'} ${index > 0 ? 'mt-4 md:-mt-10' : ''}`}
                            >
                                {/* Timeline Dot */}
                                <div className="absolute left-[20px] md:left-1/2 w-6 h-6 rounded-full border-[3px] border-white/80 bg-sky-500 shadow-md backdrop-blur-sm transform -translate-x-1/2 top-1/2 -translate-y-1/2 md:translate-y-0 md:top-auto flex items-center justify-center text-white text-[10px] sm:text-xs font-black z-20">
                                    {index + 1}
                                </div>

                                {/* Content Box */}
                                <div className={`ml-12 md:ml-0 w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white/30 backdrop-blur-md border border-white/60 p-3 sm:p-4 rounded-[1.5rem] shadow-[inset_0_0_10px_rgba(255,255,255,0.5),0_5px_15px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-white/80 hover:-translate-y-1 transition-all duration-300 group`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                                            {getPickupDisplayNameByLang(loc.name, lang)}
                                        </h3>
                                        {loc.lat && loc.lng && (
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:bg-sky-600 hover:text-white transition-all shrink-0 ml-2 border border-white/80 shadow-sm"
                                                title="구글 지도 열기"
                                            >
                                                <Navigation size={14} className="transform hover:rotate-12 transition-transform" />
                                            </a>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Time 1 */}
                                        <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-xl py-1.5 px-2 border border-white/60 shadow-inner flex items-center justify-between group-hover:bg-white/60 transition-colors">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Clock size={10} className="text-sky-600" /> {lang === 'en' ? 'AM1' : '1부'}</span>
                                            <span className="text-sm font-black text-sky-800">
                                                {loc.time_1 ? loc.time_1.substring(0, 5) : '-'}
                                            </span>
                                        </div>

                                        {/* Time 2 */}
                                        <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-xl py-1.5 px-2 border border-white/60 shadow-inner flex items-center justify-between group-hover:bg-white/60 transition-colors">
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10} className="text-rose-500" /> {lang === 'en' ? 'AM2' : '2부'}</span>
                                            <span className="text-sm font-black text-rose-600">
                                                {loc.time_2 ? loc.time_2.substring(0, 5) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
