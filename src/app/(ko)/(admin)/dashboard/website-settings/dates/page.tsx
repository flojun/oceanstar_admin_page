"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Calculator, CalendarOff, Trash2, Plus, X, Ship, ToggleLeft, ToggleRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { TourSetting } from "@/lib/tourUtils";

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

    // 환율 상태
    const [exchangeRate, setExchangeRate] = useState<number>(1350);

    // 캘린더 상태
    const [selectedBlockedDates, setSelectedBlockedDates] = useState<Date[]>([]);
    const [blockTourId, setBlockTourId] = useState<string>("all");
    const [blockReason, setBlockReason] = useState("");

    // 새 상품 추가 모달 상태
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        tour_id: '',
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        adult_price_usd: 0,
        child_price_usd: 0,
        adult_price_krw: 0,
        child_price_krw: 0,
        max_capacity: 30,
        is_flat_rate: false,
        vessel_name: '오션스타',
        display_order: 10,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: tourData, error: tourError } = await supabase
                .from('tour_settings')
                .select('*')
                .order('display_order', { ascending: true });

            if (tourError) throw tourError;
            if (tourData) setSettings(tourData);

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

    const handleFieldChange = (index: number, field: string, value: any) => {
        const newSettings = [...settings];
        newSettings[index] = { ...newSettings[index], [field]: value };
        setSettings(newSettings);
    };

    const handlePriceChange = (index: number, field: string, value: string) => {
        handleFieldChange(index, field, value === '' ? 0 : Number(value));
    };

    const handleBlockedDaysChange = (index: number, day: number) => {
        const newSettings = [...settings];
        const currentDays = newSettings[index].blocked_days || [];
        if (currentDays.includes(day)) {
            newSettings[index] = { ...newSettings[index], blocked_days: currentDays.filter(d => d !== day) };
        } else {
            newSettings[index] = { ...newSettings[index], blocked_days: [...currentDays, day] };
        }
        setSettings(newSettings);
    };

    // 판매중지 토글
    const toggleActive = async (index: number) => {
        const setting = settings[index];
        const newIsActive = !setting.is_active;

        // 즉시 UI 반영
        handleFieldChange(index, 'is_active', newIsActive);

        // DB 즉시 저장
        try {
            const { error } = await supabase
                .from('tour_settings')
                .update({ is_active: newIsActive })
                .eq('tour_id', setting.tour_id);
            if (error) throw error;
        } catch (e) {
            console.error("토글 저장 실패:", e);
            // 롤백
            handleFieldChange(index, 'is_active', !newIsActive);
            alert("상태 변경에 실패했습니다.");
        }
    };

    // 환율 일괄 적용
    const applyGlobalExchangeRate = () => {
        const newSettings = settings.map(setting => {
            return {
                ...setting,
                adult_price_krw: Math.round(((setting.adult_price_usd || 0) * exchangeRate) / 100) * 100,
                child_price_krw: Math.round(((setting.child_price_usd || 0) * exchangeRate) / 100) * 100,
            };
        });
        setSettings(newSettings);
    };

    // 저장 (투어 세팅)
    const saveSettings = async () => {
        setIsSaving(true);
        try {
            for (const setting of settings) {
                const { error } = await supabase
                    .from('tour_settings')
                    .upsert({
                        tour_id: setting.tour_id,
                        name: setting.name,
                        description: setting.description || '',
                        start_time: setting.start_time || '',
                        end_time: setting.end_time || '',
                        adult_price_usd: setting.adult_price_usd,
                        child_price_usd: setting.child_price_usd,
                        adult_price_krw: setting.adult_price_krw,
                        child_price_krw: setting.child_price_krw,
                        max_capacity: setting.max_capacity,
                        blocked_days: setting.blocked_days || [],
                        is_active: setting.is_active ?? true,
                        is_flat_rate: setting.is_flat_rate ?? false,
                        vessel_name: setting.vessel_name || '오션스타',
                        display_order: setting.display_order || 0,
                        updated_at: new Date().toISOString(),
                    });
                if (error) throw error;
            }
            alert("설정이 성공적으로 저장되었습니다.");
        } catch (e) {
            console.error("저장 실패:", e);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    // 새 상품 추가
    const addNewProduct = async () => {
        if (!newProduct.tour_id || !newProduct.name) {
            alert("옵션 ID와 상품명은 필수입니다.");
            return;
        }
        // ID 중복 체크
        if (settings.some(s => s.tour_id === newProduct.tour_id)) {
            alert("이미 존재하는 옵션 ID입니다.");
            return;
        }

        try {
            const { error } = await supabase
                .from('tour_settings')
                .insert({
                    ...newProduct,
                    blocked_days: [],
                    is_active: true,
                });
            if (error) throw error;

            setShowAddModal(false);
            setNewProduct({
                tour_id: '', name: '', description: '',
                start_time: '', end_time: '',
                adult_price_usd: 0, child_price_usd: 0,
                adult_price_krw: 0, child_price_krw: 0,
                max_capacity: 30, is_flat_rate: false,
                vessel_name: '오션스타', display_order: 10,
            });
            fetchData();
        } catch (e) {
            console.error("상품 추가 실패:", e);
            alert("상품 추가 중 오류가 발생했습니다.");
        }
    };

    // 상품 삭제
    const deleteProduct = async (tourId: string, name: string) => {
        if (!confirm(`"${name}" 상품을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            const { error } = await supabase
                .from('tour_settings')
                .delete()
                .eq('tour_id', tourId);
            if (error) throw error;
            fetchData();
        } catch (e) {
            console.error("삭제 실패:", e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    // 날짜 차단 추가
    const addBlockedDate = async () => {
        if (selectedBlockedDates.length === 0) {
            alert("차단할 날짜를 달력에서 먼저 선택해주세요.");
            return;
        }
        const inserts = selectedBlockedDates.map(date => ({
            date: format(date, 'yyyy-MM-dd'),
            tour_id: blockTourId,
            reason: blockReason || '관리자 차단'
        }));
        try {
            const { error } = await supabase.from('blocked_dates').insert(inserts);
            if (error) {
                if (error.code === '23505') alert("이미 차단된 날짜가 포함되어 있습니다.");
                else throw error;
            } else {
                setBlockReason("");
                setSelectedBlockedDates([]);
                fetchData();
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
            const { error } = await supabase.from('blocked_dates').delete().eq('date', dateStr).eq('tour_id', tourId);
            if (error) throw error;
            fetchData();
        } catch (e) {
            console.error("차단 해제 실패:", e);
            alert("오류가 발생했습니다.");
        }
    };

    // 차단 목록에서 tour_id → 이름 변환 (동적)
    const getBlockLabel = (tourId: string) => {
        if (tourId === 'all') return '전체 차단';
        const found = settings.find(s => s.tour_id === tourId);
        return found ? `${found.name} 차단` : `${tourId} 차단`;
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
            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">가격 및 날짜 관리</h1>
                    <p className="text-gray-500 mt-1">투어 상품 관리, 가격 설정, 예약 차단 날짜를 설정합니다.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* 새 상품 추가 버튼 */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" /> 새 상품 추가
                    </button>

                    {/* 환율 설정 */}
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <label className="text-sm text-gray-700 font-bold whitespace-nowrap">$1 =</label>
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
                            환율 적용
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* === 1. 가격 설정 섹션 === */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-600" /> 투어 상품 관리
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {settings.map((setting, idx) => (
                            <div
                                key={setting.tour_id}
                                className={`p-5 border rounded-xl space-y-4 transition-all ${setting.is_active === false
                                        ? 'border-red-200 bg-red-50/30 opacity-70'
                                        : 'border-gray-100 bg-gray-50/50'
                                    }`}
                            >
                                {/* 카드 헤더: 이름 + 토글 + 뱃지 */}
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={setting.name}
                                            onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                            className="font-bold text-gray-800 text-lg bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 transition-colors"
                                        />

                                        {/* 고정 요금 뱃지 */}
                                        {setting.is_flat_rate && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                                                고정요금
                                            </span>
                                        )}

                                        {/* 선박 뱃지 */}
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                                            <Ship className="w-3 h-3" /> {setting.vessel_name || '오션스타'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* 판매중지 토글 */}
                                        <button
                                            onClick={() => toggleActive(idx)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${setting.is_active === false
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                }`}
                                        >
                                            {setting.is_active === false ? (
                                                <><ToggleLeft className="w-4 h-4" /> 판매중지</>
                                            ) : (
                                                <><ToggleRight className="w-4 h-4" /> 판매중</>
                                            )}
                                        </button>

                                        {/* 삭제 버튼 */}
                                        <button
                                            onClick={() => deleteProduct(setting.tour_id, setting.name)}
                                            className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"
                                            title="상품 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 설명 + 시간 + 선박 + 고정요금 */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">시작 시간</label>
                                        <input type="time" value={setting.start_time || ''}
                                            onChange={(e) => handleFieldChange(idx, 'start_time', e.target.value)}
                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">종료 시간</label>
                                        <input type="time" value={setting.end_time || ''}
                                            onChange={(e) => handleFieldChange(idx, 'end_time', e.target.value)}
                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">배정 선박</label>
                                        <input type="text" value={setting.vessel_name || '오션스타'}
                                            onChange={(e) => handleFieldChange(idx, 'vessel_name', e.target.value)}
                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox"
                                                checked={setting.is_flat_rate || false}
                                                onChange={(e) => handleFieldChange(idx, 'is_flat_rate', e.target.checked)}
                                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                                            <span className="text-sm font-medium text-gray-700">고정 요금제</span>
                                        </label>
                                    </div>
                                </div>

                                {/* 가격 영역 */}
                                <div className="grid grid-cols-2 gap-6">
                                    {setting.is_flat_rate ? (
                                        /* 고정 요금제: 단일 가격 */
                                        <div className="col-span-2 space-y-3">
                                            <h4 className="text-sm font-semibold text-purple-600">고정 대관료 (Flat Rate)</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">대관료 USD ($)</label>
                                                    <input type="number" value={setting.adult_price_usd}
                                                        onChange={(e) => handlePriceChange(idx, 'adult_price_usd', e.target.value)}
                                                        className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-purple-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">대관료 KRW (₩)</label>
                                                    <input type="number" value={setting.adult_price_krw}
                                                        onChange={(e) => handlePriceChange(idx, 'adult_price_krw', e.target.value)}
                                                        className="w-full p-2 text-sm border-2 border-purple-200 rounded focus:ring-1 focus:ring-purple-500 font-bold text-gray-900 bg-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">최대 탑승 인원</label>
                                                <input type="number" value={setting.max_capacity}
                                                    onChange={(e) => handlePriceChange(idx, 'max_capacity', e.target.value)}
                                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        /* 일반 옵션: 성인/아동 분리 */
                                        <>
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-gray-500">외화 (USD)</h4>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">성인 ($)</label>
                                                    <input type="number" value={setting.adult_price_usd}
                                                        onChange={(e) => handlePriceChange(idx, 'adult_price_usd', e.target.value)}
                                                        className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">아동 ($)</label>
                                                    <input type="number" value={setting.child_price_usd}
                                                        onChange={(e) => handlePriceChange(idx, 'child_price_usd', e.target.value)}
                                                        className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-blue-600">한화 (KRW)</h4>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">성인 (₩)</label>
                                                    <input type="number" value={setting.adult_price_krw}
                                                        onChange={(e) => handlePriceChange(idx, 'adult_price_krw', e.target.value)}
                                                        className="w-full p-2 text-sm border-2 border-blue-200 rounded focus:ring-1 focus:ring-blue-500 font-bold text-gray-900 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">아동 (₩)</label>
                                                    <input type="number" value={setting.child_price_krw}
                                                        onChange={(e) => handlePriceChange(idx, 'child_price_krw', e.target.value)}
                                                        className="w-full p-2 text-sm border-2 border-blue-200 rounded focus:ring-1 focus:ring-blue-500 font-bold text-gray-900 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1 mt-3">총 정원 (Max Pax)</label>
                                                    <input type="number" value={setting.max_capacity}
                                                        onChange={(e) => handlePriceChange(idx, 'max_capacity', e.target.value)}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* 정기 휴무 요일 */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">정기 휴무 요일 지정</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { label: '일', value: 0 }, { label: '월', value: 1 },
                                            { label: '화', value: 2 }, { label: '수', value: 3 },
                                            { label: '목', value: 4 }, { label: '금', value: 5 },
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
                            전체 설정 저장
                        </button>
                    </div>
                </div>

                {/* === 2. 차단 날짜 달력 섹션 === */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CalendarOff className="w-5 h-5 text-red-500" /> 예약 불가(휴무) 날짜 지정
                    </h2>

                    <div className="flex flex-col lg:flex-row xl:flex-col gap-8 flex-1 overflow-hidden">
                        {/* 달력 */}
                        <div className="flex justify-center border border-gray-100 rounded-xl p-4 bg-slate-50/50 h-fit shrink-0 overflow-x-auto">
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
                                <h3 className="text-sm font-bold text-gray-700 mb-3">선택된 날짜 차단하기</h3>
                                <p className="text-sm text-blue-600 font-medium mb-3">
                                    선택일: {selectedBlockedDates.length > 0
                                        ? `${selectedBlockedDates.length}개 날짜 선택됨`
                                        : '달력에서 날짜를 클릭하세요'}
                                </p>

                                {/* 동적 드롭다운 */}
                                <select
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mb-3 bg-white"
                                    value={blockTourId}
                                    onChange={(e) => setBlockTourId(e.target.value)}
                                >
                                    <option value="all">모든 투어 차단 (전체 휴무)</option>
                                    {settings.map(s => (
                                        <option key={s.tour_id} value={s.tour_id}>
                                            {s.name}만 차단
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    placeholder="차단 사유 (예: 기상악화, 정기휴무)"
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
                                            <li key={`${bd.date}-${bd.tour_id}`} className="p-3 hover:bg-gray-50 flex items-start sm:items-center justify-between group gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                                        <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{format(new Date(bd.date), 'yyyy년 MM월 dd일')}</span>
                                                        <span className="text-xs font-normal text-gray-500 whitespace-nowrap">
                                                            ({format(new Date(bd.date), 'EEEE', { locale: ko })})
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${bd.tour_id === 'all' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            {getBlockLabel(bd.tour_id)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-red-500 flex items-start sm:items-center gap-1 break-keep">
                                                        <CalendarOff className="w-3 h-3 shrink-0 mt-0.5 sm:mt-0" /> 
                                                        <span>{bd.reason}</span>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeBlockedDate(bd.date, bd.tour_id)}
                                                    className="text-gray-300 hover:text-red-500 p-2 rounded transition-colors shrink-0"
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

            {/* === 새 상품 추가 모달 === */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">새 투어 상품 추가</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">옵션 ID (영문) *</label>
                                    <input type="text" value={newProduct.tour_id} placeholder="예: vip_cruise"
                                        onChange={(e) => setNewProduct({ ...newProduct, tour_id: e.target.value.replace(/[^a-z0-9_]/g, '') })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">상품명 (한글) *</label>
                                    <input type="text" value={newProduct.name} placeholder="예: VIP 크루즈"
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
                                <input type="text" value={newProduct.description} placeholder="예: 프리미엄 크루즈 투어"
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                                    <input type="time" value={newProduct.start_time}
                                        onChange={(e) => setNewProduct({ ...newProduct, start_time: e.target.value })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                                    <input type="time" value={newProduct.end_time}
                                        onChange={(e) => setNewProduct({ ...newProduct, end_time: e.target.value })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">성인 가격 (USD)</label>
                                    <input type="number" value={newProduct.adult_price_usd}
                                        onChange={(e) => setNewProduct({ ...newProduct, adult_price_usd: Number(e.target.value) })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">성인 가격 (KRW)</label>
                                    <input type="number" value={newProduct.adult_price_krw}
                                        onChange={(e) => setNewProduct({ ...newProduct, adult_price_krw: Number(e.target.value) })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">아동 가격 (USD)</label>
                                    <input type="number" value={newProduct.child_price_usd}
                                        onChange={(e) => setNewProduct({ ...newProduct, child_price_usd: Number(e.target.value) })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">아동 가격 (KRW)</label>
                                    <input type="number" value={newProduct.child_price_krw}
                                        onChange={(e) => setNewProduct({ ...newProduct, child_price_krw: Number(e.target.value) })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">정원</label>
                                    <input type="number" value={newProduct.max_capacity}
                                        onChange={(e) => setNewProduct({ ...newProduct, max_capacity: Number(e.target.value) })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">배정 선박</label>
                                    <input type="text" value={newProduct.vessel_name}
                                        onChange={(e) => setNewProduct({ ...newProduct, vessel_name: e.target.value })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                                    <input type="number" value={newProduct.display_order}
                                        onChange={(e) => setNewProduct({ ...newProduct, display_order: Number(e.target.value) })}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg cursor-pointer">
                                <input type="checkbox" checked={newProduct.is_flat_rate}
                                    onChange={(e) => setNewProduct({ ...newProduct, is_flat_rate: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                                <div>
                                    <span className="text-sm font-bold text-purple-700">고정 요금제 (Flat Rate)</span>
                                    <p className="text-xs text-purple-500">프라이빗 차터처럼 보트 단위 고정 요금인 경우 체크</p>
                                </div>
                            </label>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                                취소
                            </button>
                            <button onClick={addNewProduct}
                                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors">
                                상품 추가
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
