"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, ChevronDown, Calendar as CalendarIcon, CheckSquare, List as ListIcon, Eye, X, ArrowUpDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { ReservationTable } from "@/components/ReservationTable";
import { ReservationModal } from "@/components/ReservationModal";
import { useReservationFilter, FilterTab, SortOption } from "@/hooks/useReservationFilter";
import { cn, calculateTotalPax } from "@/lib/utils";
import { getHawaiiDateStr, getHawaiiTomorrowStr, formatDateDisplay } from "@/lib/timeUtils";
import { DatePicker } from "@/components/ui/DatePicker";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

type ViewMode = 'today' | 'reconfirm' | 'custom';

interface ReservationListViewProps {
    defaultDate?: string;
}

export function ReservationListView({ defaultDate }: ReservationListViewProps) {
    // Determine initial state based on defaultDate or current date
    const initialDate = defaultDate || getHawaiiDateStr();

    const getInitialViewMode = (date: string): ViewMode => {
        const today = getHawaiiDateStr();
        const tomorrow = getHawaiiTomorrowStr();
        if (date === today) return 'today';
        if (date === tomorrow) return 'reconfirm';
        return 'custom';
    };

    // State
    const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode(initialDate));
    const [selectedDate, setSelectedDate] = useState<string>(initialDate);

    // Data State
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isListSelectOpen, setIsListSelectOpen] = useState(false);
    const [isSimpleView, setIsSimpleView] = useState(false);

    // Search State
    const [searchCriteria, setSearchCriteria] = useState<'name' | 'source' | 'tour_date' | 'contact'>('name');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter Hook
    const { activeTab, setActiveTab, filteredData: tabFilteredData, groupedSections, sortOption, setSortOption } = useReservationFilter(reservations);

    // Apply search filter on top of tab filter
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return tabFilteredData;

        let query = searchQuery.toLowerCase().trim();

        // Special handling for tour_date: normalize date formats
        if (searchCriteria === 'tour_date') {
            const dateMatch = query.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (dateMatch) {
                const [, month, day, year] = dateMatch;
                query = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        return tabFilteredData.filter(row => {
            const value = String(row[searchCriteria] || '').toLowerCase();
            return value.includes(query);
        });
    }, [tabFilteredData, searchQuery, searchCriteria]);

    // Mode Switching Logic
    const handleModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        setIsListSelectOpen(false);

        if (mode === 'today') {
            setSelectedDate(getHawaiiDateStr());
        } else if (mode === 'reconfirm') {
            setSelectedDate(getHawaiiTomorrowStr());
        }
        // 'custom' keeps current selectedDate or user picks it
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);

        const today = getHawaiiDateStr();
        const tomorrow = getHawaiiTomorrowStr();

        if (date === today) {
            setViewMode('today');
        } else if (date === tomorrow) {
            setViewMode('reconfirm');
        } else {
            setViewMode('custom');
        }
        setIsListSelectOpen(false);
    };

    // Data Fetching
    const fetchReservations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("reservations")
                .select("*")
                .eq("tour_date", selectedDate)
                .neq("status", "취소")
                .order("option", { ascending: true })
                .order("pickup_location", { ascending: true });

            if (error) throw error;
            setReservations(data || []);
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [selectedDate]);

    // Handlers
    const handleCreate = () => {
        setSelectedReservation(null);
        setIsModalOpen(true);
    };

    const handleEdit = (reservation: Reservation) => {
        setSelectedReservation(reservation);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            const { error } = await supabase.from("reservations").delete().eq("id", id);
            if (error) throw error;
            fetchReservations();
        } catch (error) {
            console.error("Error deleting reservation:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const handleReconfirmToggle = async (id: string, currentVal: boolean) => {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, is_reconfirmed: !currentVal } : r));
        try {
            const { error } = await supabase.from("reservations").update({ is_reconfirmed: !currentVal }).eq("id", id);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating reconfirm:", error);
            fetchReservations();
            alert("업데이트 실패");
        }
    };

    const handleSuccess = () => {
        fetchReservations();
    };

    // UI Helpers
    const getPageTitle = () => {
        const dateObj = parseISO(selectedDate);
        const dayName = format(dateObj, 'eee', { locale: ko });
        const formattedDate = format(dateObj, 'MM-dd-yyyy');

        let prefix = "예약 명단";
        if (viewMode === 'today') prefix = "오늘 명단";
        if (viewMode === 'reconfirm') prefix = "리컨펌";

        return `${prefix} (${dayName} / ${formattedDate})`;
    };

    const renderTabs = () => {
        const tabs: FilterTab[] = ['전체', '1부', '2부', '3부', '패러 및 제트', '패러', '제트', '기타'];

        return (
            <div className="md:pb-0">
                {/* Mobile Dropdown */}
                <div className="md:hidden w-32">
                    <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as any)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white font-semibold text-gray-700"
                    >
                        {tabs.map((tab) => (
                            <option key={tab} value={tab}>{tab}</option>
                        ))}
                    </select>
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex flex-wrap gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm",
                                activeTab === tab
                                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200"
                                    : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderListSelect = () => (
        <div className="relative">
            <button
                onClick={() => setIsListSelectOpen(!isListSelectOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none shadow-sm"
            >
                <ListIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xs md:text-sm text-center">
                    <span className="md:hidden">명단<br />선택</span>
                    <span className="hidden md:inline">명단선택</span>
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isListSelectOpen && (
                <>
                    <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-visible flex flex-col p-1">
                        <button
                            onClick={() => handleModeChange('today')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-blue-50 transition-colors",
                                viewMode === 'today' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                            )}
                        >
                            <CheckSquare className={cn("w-4 h-4", viewMode === 'today' ? "opacity-100" : "opacity-0")} />
                            오늘 명단
                        </button>
                        <button
                            onClick={() => handleModeChange('reconfirm')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-blue-50 transition-colors",
                                viewMode === 'reconfirm' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                            )}
                        >
                            <CheckSquare className={cn("w-4 h-4", viewMode === 'reconfirm' ? "opacity-100" : "opacity-0")} />
                            리컨펌
                        </button>

                        <div className="h-px bg-gray-100 my-1"></div>

                        {/* Date Picker Integration */}
                        <div className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block px-1">날짜 직접 선택</label>
                            <DatePicker
                                value={selectedDate}
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>
                    <div className="fixed inset-0 z-40" onClick={() => setIsListSelectOpen(false)} />
                </>
            )}
        </div>
    );

    const renderControls = () => {
        return (
            <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>정렬</span>
                    </button>
                    {isSortOpen && (
                        <>
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                                <button onClick={() => { setSortOption('receipt_asc'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'receipt_asc' && "text-blue-600 font-bold bg-blue-50")}>접수일 (오름차순)</button>
                                <button onClick={() => { setSortOption('receipt_desc'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'receipt_desc' && "text-blue-600 font-bold bg-blue-50")}>접수일 (내림차순)</button>
                                <button onClick={() => { setSortOption('source'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'source' && "text-blue-600 font-bold bg-blue-50")}>예약 경로별</button>
                                <button onClick={() => { setSortOption('pickup'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'pickup' && "text-blue-600 font-bold bg-blue-50")}>픽업 장소별</button>
                            </div>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                        </>
                    )}
                </div>

                {/* Simple View Toggle (Mobile & Desktop) */}
                <button
                    onClick={() => setIsSimpleView(true)}
                    className={cn(
                        "flex items-center justify-center p-2.5 rounded-md border shadow-sm transition-colors",
                        "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    )}
                    title="한눈에 보기"
                >
                    <Eye className="w-5 h-5" />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{getPageTitle()}</h2>
                    <p className="text-sm text-gray-500">
                        {viewMode === 'today' && "당일 투어 진행 현황입니다."}
                        {viewMode === 'reconfirm' && "내일 투어 예약자 리컨펌 체크 현황입니다."}
                        {viewMode === 'custom' && `선택하신 날짜 (${formatDateDisplay(selectedDate)})의 예약 명단입니다.`}
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    새 예약 등록
                </button>
            </div>

            {/* Search Bar */}
            <div className="shrink-0 flex gap-2 items-center pb-2">
                <select
                    value={searchCriteria}
                    onChange={(e) => setSearchCriteria(e.target.value as any)}
                    className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                >
                    <option value="name">예약자명</option>
                    <option value="source">경로</option>
                    <option value="tour_date">예약일</option>
                    <option value="contact">연락처</option>
                </select>
                <div className="relative flex-1 sm:w-64">
                    <input
                        type="text"
                        placeholder="검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="검색 초기화"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="shrink-0 flex items-center justify-between gap-2 pb-2">
                {/* Left: List Select */}
                <div className="shrink-0">
                    {renderListSelect()}
                </div>

                {/* Center: Tabs */}
                {/* Desktop: Centered. Mobile: Between ListSelect and Controls */}
                <div className="flex-1 flex justify-center">
                    {renderTabs()}
                </div>

                {/* Right: Controls */}
                <div className="shrink-0 flex items-center gap-2">
                    {renderControls()}
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm min-h-0">
                {activeTab === '전체' && groupedSections ? (
                    <div className="divide-y divide-gray-100">
                        {Object.entries(groupedSections).map(([groupName, items]) => {
                            if (items.length === 0) return null;
                            return (
                                <div key={groupName} className="p-4">
                                    <h3 className="mb-3 text-lg font-bold text-blue-800 flex items-center gap-2">
                                        <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                                        {groupName}
                                        <span className="text-sm font-bold text-black bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                            총 {calculateTotalPax(items)}명
                                        </span>
                                    </h3>
                                    <ReservationTable
                                        reservations={items}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onReconfirmToggle={handleReconfirmToggle}
                                        loading={false}
                                    />
                                </div>
                            );
                        })}
                        {reservations.length === 0 && !loading && (
                            <div className="p-12 text-center text-gray-400">예약 명단이 없습니다.</div>
                        )}
                    </div>
                ) : (
                    <div className="h-full bg-white">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                                {activeTab}
                                <span className="text-sm font-bold text-black bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                    총 {calculateTotalPax(filteredData)}명
                                </span>
                            </h3>
                        </div>
                        <ReservationTable
                            reservations={filteredData}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onReconfirmToggle={handleReconfirmToggle}
                            loading={loading}
                        />
                    </div>
                )}

                {/* Full Screen Simple View Overlay */}
                {isSimpleView && (
                    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
                            <h3 className="font-bold text-lg">한눈에 보기</h3>
                            <button
                                onClick={() => setIsSimpleView(false)}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 bg-gray-50">
                            {/* Wrap table in a container for larger screens if needed, or keeping full width */}
                            <div className="max-w-7xl mx-auto">
                                {activeTab === '전체' && groupedSections ? (
                                    <div className="divide-y divide-gray-100 space-y-4">
                                        {Object.entries(groupedSections).map(([groupName, items]) => {
                                            if (items.length === 0) return null;
                                            return (
                                                <div key={groupName} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                                                    <h3 className="mb-3 text-lg font-bold text-blue-800 flex items-center gap-2">
                                                        <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                                                        {groupName}
                                                        <span className="text-sm font-bold text-black bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                                            총 {calculateTotalPax(items)}명
                                                        </span>
                                                    </h3>
                                                    <ReservationTable
                                                        reservations={items}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                        onReconfirmToggle={handleReconfirmToggle}
                                                        loading={false}
                                                        isSimpleView={true}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {reservations.length === 0 && !loading && (
                                            <div className="p-12 text-center text-gray-400">예약 명단이 없습니다.</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                        <div className="mb-3">
                                            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                                <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                                                {activeTab}
                                                <span className="text-sm font-bold text-black bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                                    총 {calculateTotalPax(filteredData)}명
                                                </span>
                                            </h3>
                                        </div>
                                        <ReservationTable
                                            reservations={filteredData}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onReconfirmToggle={handleReconfirmToggle}
                                            loading={loading}
                                            isSimpleView={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ReservationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                reservation={selectedReservation}
            />
        </div>
    );
}
