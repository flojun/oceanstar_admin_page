"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Calculator, CalendarOff, Trash2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type TourSetting = {
    tour_id: string;
    name: string;
    adult_price_usd: number;
    child_price_usd: number;
    adult_price_krw: number;
    child_price_krw: number;
    max_capacity: number;
    blocked_days: number[];
};

type BlockedDate = {
    date: string;
    tour_id: string;
    reason: string | null;
};

export default function WebsiteSettingsPage() {
    const [settings, setSettings] = useState<TourSetting[]>([]);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 환율 상태 (외부 API를 호출하거나 수동 입력값을 사용)
    const [exchangeRate, setExchangeRate] = useState<number>(1350);

    // 캘린더 상태
    const [selectedBlockedDates, setSelectedBlockedDates] = useState<Date[]>([]);
    const [blockTourId, setBlockTourId] = useState<string>("all");
    const [blockReason, setBlockReason] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. 투어 세팅 가져오기
            const { data: tourData, error: tourError } = await supabase
                .from('tour_settings')
                .select('*')
                .order('tour_id');

            if (tourError) throw tourError;
            if (tourData) setSettings(tourData);

            // 2. 차단 날짜 가져오기
            const { data: blockData, error: blockError } = await supabase
                .from('blocked_dates')
                .select('*')
                .order('date');

            if (blockError) throw blockError;
            if (blockData) setBlockedDates(blockData);

        } catch (e) {
            console.error("데이터 로딩 실패:", e);
            alert("데이터를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePriceChange = (index: number, field: keyof TourSetting, value: string) => {
        const newSettings = [...settings];
        newSettings[index] = {
            ...newSettings[index],
            [field]: value === '' ? 0 : Number(value)
        };
        setSettings(newSettings);
    };

    const handleBlockedDaysChange = (index: number, day: number) => {
        const newSettings = [...settings];
        const currentDays = newSettings[index].blocked_days || [];

        if (currentDays.includes(day)) {
            newSettings[index].blocked_days = currentDays.filter(d => d !== day);
        } else {
            newSettings[index].blocked_days = [...currentDays, day];
        }
        setSettings(newSettings);
    };

    // 환율 일괄 적용 계산 핸들러
    const applyGlobalExchangeRate = () => {
        const newSettings = settings.map(setting => {
            const calcAdultKrw = Math.round((setting.adult_price_usd * exchangeRate) / 100) * 100;
            const calcChildKrw = Math.round((setting.child_price_usd * exchangeRate) / 100) * 100;
            return {
                ...setting,
                adult_price_krw: calcAdultKrw,
                child_price_krw: calcChildKrw
            };
        });
        setSettings(newSettings);
    };

    // 저장 로직 (투어 세팅)
    const saveSettings = async () => {
        setIsSaving(true);
        try {
            for (const setting of settings) {
                const { error } = await supabase
                    .from('tour_settings')
                    .upsert({
                        tour_id: setting.tour_id,
                        name: setting.name,
                        adult_price_usd: setting.adult_price_usd,
                        child_price_usd: setting.child_price_usd,
                        adult_price_krw: setting.adult_price_krw,
                        child_price_krw: setting.child_price_krw,
                        max_capacity: setting.max_capacity,
                        blocked_days: setting.blocked_days || [],
                        updated_at: new Date().toISOString(),
                    });
                if (error) throw error;
            }
            alert("가격 및 정원 설정이 성공적으로 저장되었습니다.");
        } catch (e) {
            console.error("저장 실패:", e);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    // 날짜 차단 추가
    const addBlockedDate = async () => {
        if (selectedBlockedDates.length === 0) {
            alert("차단할 날짜를 달력에서 먼저 선택해주세요. (여러 개 선택 가능)");
            return;
        }

        const inserts = selectedBlockedDates.map(date => ({
            date: format(date, 'yyyy-MM-dd'),
            tour_id: blockTourId,
            reason: blockReason || '관리자 차단'
        }));

        try {
            const { error } = await supabase
                .from('blocked_dates')
                .insert(inserts);

            if (error) {
                if (error.code === '23505') alert("이미 일부 옵션에 대해 휴무/차단 처리된 날짜가 포함되어 있습니다.");
                else throw error;
            } else {
                setBlockReason("");
                setSelectedBlockedDates([]);
                fetchData(); // 재로딩하여 표시
            }
        } catch (e) {
            console.error("날짜 차단 실패:", e);
            alert("날짜 추가 중 오류가 발생했습니다.");
        }
    };

    // 날짜 차단 해제
    const removeBlockedDate = async (dateStr: string, tourId: string) => {
        if (!confirm(`${dateStr}의 예약 차단을 해제하시겠습니까?`)) return;

        try {
            const { error } = await supabase
                .from('blocked_dates')
                .delete()
                .eq('date', dateStr)
                .eq('tour_id', tourId);

            if (error) throw error;
            fetchData();
        } catch (e) {
            console.error("차단 해제 실패:", e);
            alert("오류가 발생했습니다.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">예약홈페이지 관리</h1>
                    <p className="text-gray-500 mt-1">고객 전용 웹사이트의 투어 가격 및 예약 차단 날짜를 설정합니다.</p>
                </div>

                {/* 글로벌 환율 설정 영역 */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-sm text-gray-700 font-bold whitespace-nowrap">기준 환율 $1 =</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₩</span>
                        <input
                            type="number"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(Number(e.target.value))}
                            className="pl-7 pr-3 py-2 w-28 text-base border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-extrabold text-blue-900 bg-blue-50/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={applyGlobalExchangeRate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
                    >
                        일괄 환율 적용
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* === 1. 가격 설정 섹션 === */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-600" /> 투어 가격 및 정원 설정
                        </h2>
                    </div>

                    <div className="space-y-8">
                        {settings.map((setting, idx) => (
                            <div key={setting.tour_id} className="p-5 border border-gray-100 bg-gray-50/50 rounded-xl space-y-4">
                                <h3 className="font-bold text-gray-800 text-lg border-b pb-2">{setting.name}</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* 달러 입력 영역 */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-500">외화 기준 (USD)</h4>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">성인 ($)</label>
                                            <input
                                                type="number"
                                                value={setting.adult_price_usd}
                                                onChange={(e) => handlePriceChange(idx, 'adult_price_usd', e.target.value)}
                                                className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">아동 ($)</label>
                                            <input
                                                type="number"
                                                value={setting.child_price_usd}
                                                onChange={(e) => handlePriceChange(idx, 'child_price_usd', e.target.value)}
                                                className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* 원화 입력 영역 */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-blue-600">고객 노출 한화 (KRW)</h4>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">성인 (₩)</label>
                                            <input
                                                type="number"
                                                value={setting.adult_price_krw}
                                                onChange={(e) => handlePriceChange(idx, 'adult_price_krw', e.target.value)}
                                                className="w-full p-2 text-sm border-2 border-blue-200 rounded focus:ring-1 focus:ring-blue-500 font-bold text-gray-900 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">아동 (₩)</label>
                                            <input
                                                type="number"
                                                value={setting.child_price_krw}
                                                onChange={(e) => handlePriceChange(idx, 'child_price_krw', e.target.value)}
                                                className="w-full p-2 text-sm border-2 border-blue-200 rounded focus:ring-1 focus:ring-blue-500 font-bold text-gray-900 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1 mt-3">투어 총 정원 (Max Pax)</label>
                                            <input
                                                type="number"
                                                value={setting.max_capacity}
                                                onChange={(e) => handlePriceChange(idx, 'max_capacity', e.target.value)}
                                                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 요일별 예약 불가 설정 */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">정기 휴무 요일 지정 (자동 차단)</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { label: '일', value: 0 },
                                            { label: '월', value: 1 },
                                            { label: '화', value: 2 },
                                            { label: '수', value: 3 },
                                            { label: '목', value: 4 },
                                            { label: '금', value: 5 },
                                            { label: '토', value: 6 },
                                        ].map((day) => (
                                            <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(setting.blocked_days || []).includes(day.value)}
                                                    onChange={() => handleBlockedDaysChange(idx, day.value)}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-600 select-none">{day.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={saveSettings}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            설정 저장하기
                        </button>
                    </div>
                </div>

                {/* === 2. 차단 날짜 달력 섹션 === */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CalendarOff className="w-5 h-5 text-red-500" /> 예약 불가(휴무) 날짜 지정
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8 flex-1">
                        {/* 달력 픽커 */}
                        <div className="flex justify-center border border-gray-100 rounded-xl p-4 bg-slate-50/50 h-fit">
                            <DayPicker
                                mode="multiple"
                                selected={selectedBlockedDates}
                                onSelect={(dates) => setSelectedBlockedDates(dates as Date[])}
                                locale={ko}
                                modifiers={{
                                    blocked: blockedDates.map(bd => new Date(bd.date))
                                }}
                                modifiersStyles={{
                                    blocked: { textDecoration: 'line-through', color: 'red', fontWeight: 'bold' }
                                }}
                                className="bg-white p-2 rounded-lg shadow-sm"
                            />
                        </div>

                        {/* 추가 폼 & 리스트 */}
                        <div className="flex-1 flex flex-col">
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-6">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">선택된 날짜 차단하기 (다중 선택 가능)</h3>
                                <p className="text-sm text-blue-600 font-medium mb-3">
                                    선택일: {selectedBlockedDates.length > 0
                                        ? `${selectedBlockedDates.length}개 날짜 선택됨`
                                        : '달력에서 날짜를 클릭하세요'}
                                </p>
                                <select
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mb-3 bg-white"
                                    value={blockTourId}
                                    onChange={(e) => setBlockTourId(e.target.value)}
                                >
                                    <option value="all">모든 투어 차단 (전체 휴무)</option>
                                    <option value="morning1">1부 거북이 스노클링만 차단</option>
                                    <option value="morning2">2부 거북이 스노클링만 차단</option>
                                    <option value="sunset">선셋 거북이 스노클링만 차단</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="단 사유 (예: 기상악화, 정기휴무)"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mb-3"
                                />
                                <button
                                    onClick={addBlockedDate}
                                    disabled={selectedBlockedDates.length === 0}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    해당 옵션 차단
                                </button>
                            </div>

                            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                                차단된 날짜 목록
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{blockedDates.length}일</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl max-h-[300px]">
                                {blockedDates.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-400">등록된 차단 날짜가 없습니다.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {blockedDates.map((bd) => (
                                            <li key={`${bd.date}-${bd.tour_id}`} className="p-3 hover:bg-gray-50 flex items-center justify-between group">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{format(new Date(bd.date), 'yyyy년 MM월 dd일')}
                                                        <span className="ml-2 text-xs font-normal text-gray-500">
                                                            ({format(new Date(bd.date), 'EEEE', { locale: ko })})
                                                        </span>
                                                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${bd.tour_id === 'all' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            {bd.tour_id === 'all' ? '전체 차단' : bd.tour_id === 'morning1' ? '1부 차단' : bd.tour_id === 'morning2' ? '2부 차단' : '선셋 차단'}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                        <CalendarOff className="w-3 h-3" /> {bd.reason}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeBlockedDate(bd.date, bd.tour_id)}
                                                    className="text-gray-300 hover:text-red-500 p-2 rounded transition-colors"
                                                    title="차단 해제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
