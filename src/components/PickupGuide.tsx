"use client";

import { useEffect, useState } from 'react';
import { MapPin, ChevronDown, ChevronUp, Map } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPickupDisplayName } from '@/constants/pickupLocations';

export default function PickupGuide() {
    const [locations, setLocations] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.from('pickup_locations').select('*')
            .then(({ data }) => {
                if (data && data.length > 0) {
                    const sorted = data.sort((a, b) => (a.time_1 || '').localeCompare(b.time_1 || ''));
                    setLocations(sorted);
                }
                setIsLoading(false);
            });
    }, []);

    if (isLoading || locations.length === 0) return null;

    return (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-12 overflow-hidden hover:shadow-md transition-shadow">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 sm:p-6 bg-white hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4 text-left">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 shadow-inner">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">📍 오션스타 픽업 장소 및 출발 시간표</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">11개의 지정 픽업 장소 시간표와 지도를 확인하세요.</p>
                    </div>
                </div>
                <div className="text-slate-400 bg-slate-100 p-2 rounded-full hidden sm:block">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-5 py-4 whitespace-nowrap">픽업 장소 (호텔/위치)</th>
                                    <th className="px-5 py-4 whitespace-nowrap text-center text-blue-700">1부 탑승</th>
                                    <th className="px-5 py-4 whitespace-nowrap text-center text-rose-600">2부 탑승</th>
                                    <th className="px-5 py-4 whitespace-nowrap text-center text-slate-700">지도 보기</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {locations.map(loc => (
                                    <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                                            {getPickupDisplayName(loc.name)}
                                        </td>
                                        <td className="px-5 py-4 text-center font-bold text-slate-600">
                                            {loc.time_1 ? loc.time_1.substring(0, 5) : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-center font-bold text-slate-600">
                                            {loc.time_2 ? loc.time_2.substring(0, 5) : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {loc.lat && loc.lng ? (
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-colors shadow-sm"
                                                >
                                                    <Map size={14} /> 구글맵 열기
                                                </a>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
