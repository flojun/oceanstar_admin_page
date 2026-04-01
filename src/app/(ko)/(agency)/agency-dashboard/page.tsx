"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation, ReservationStatus } from "@/types/reservation";
import { createAgencyReservation, updateAgencyReservation, cancelAgencyReservation, getAgencyAvailabilityWeekly } from "@/actions/agency";
import { Loader2, Plus, Calendar as CalIcon, Edit2, Trash2, Search, X, ChevronLeft, ChevronRight, Download } from "lucide-react";

export default function AgencyDashboardPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [sortFilter, setSortFilter] = useState("TOUR_ASC");

    const [availabilityStart, setAvailabilityStart] = useState(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });

    const [availability, setAvailability] = useState<{ date: string; availability: { option: string; status: string }[] }[]>([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Initial Form State
    const initialForm = {
        name: "", // 예약자명
        tour_date: "", // 예약일
        adults: 2, // 성인
        children: 0, // 아동
        infants: 0, // 유아
        option: "1부", // 옵션 (기본값)
        pickup_location: "", // 픽업장소
        contact: "", // 연락처(담당가이드)
        note: "" // 기타사항
    };

    const [formData, setFormData] = useState(initialForm);
    const [formLoading, setFormLoading] = useState(false);
    const [agencyName, setAgencyName] = useState<string>("여행사");

    const fetchReservations = async () => {
        setLoading(true);
        const res = await fetch('/api/agency/reservations');
        if (res.ok) {
            const data = await res.json();
            setReservations(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReservations();

        const getAgencyContext = async () => {
            const { getAgencySession } = await import('@/actions/agency');
            const session = await getAgencySession();
            if (session.name) setAgencyName(session.name);
        };
        getAgencyContext();
    }, []);

    // Fetch Availability when availabilityStart changes
    useEffect(() => {
        const fetchAvailability = async () => {
            setAvailabilityLoading(true);
            const startStr = availabilityStart;

            const d = new Date(availabilityStart + 'T12:00:00');
            d.setDate(d.getDate() + 6);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const endStr = `${yyyy}-${mm}-${dd}`;

            const result = await getAgencyAvailabilityWeekly(startStr, endStr);
            if (result.success && result.data) {
                setAvailability(result.data);
            } else {
                setAvailability([]);
            }
            setAvailabilityLoading(false);
        };

        fetchAvailability();
    }, [availabilityStart]);

    const shiftAvailabilityStart = (days: number) => {
        const d = new Date(availabilityStart + 'T12:00:00');
        d.setDate(d.getDate() + days);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setAvailabilityStart(`${yyyy}-${mm}-${dd}`);
    };

    const openForm = (mode: 'add' | 'edit', res?: Reservation) => {
        setFormMode(mode);
        if (mode === 'edit' && res) {
            setSelectedId(res.id);
            let a = 2, c = 0, i = 0;
            if (res.note) {
                const match = res.note.match(/\(성(\d+), 아(\d+), 유(\d+)\)/);
                if (match) {
                    a = parseInt(match[1]);
                    c = parseInt(match[2]);
                    i = parseInt(match[3]);
                }
            }

            setFormData({
                name: res.name || "",
                tour_date: res.tour_date || "",
                adults: a,
                children: c,
                infants: i,
                option: res.option || "1부",
                pickup_location: res.pickup_location || "",
                contact: res.contact || "",
                note: res.note?.replace(/\(성\d+, 아\d+, 유\d+\)\s*/g, '') || ""
            });
        } else {
            setSelectedId(null);
            setFormData(initialForm);
        }
        setIsFormOpen(true);
        // 모바일 사파리 등에서 배경 스크롤 방지
        document.body.style.overflow = "hidden";
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setFormData(initialForm);
        document.body.style.overflow = "auto";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        const totalPax = formData.adults + formData.children + formData.infants;
        const paxString = `${totalPax}명`;
        const paxBreakdown = `(성${formData.adults}, 아${formData.children}, 유${formData.infants}) `;
        const finalNote = formData.note ? `${paxBreakdown}${formData.note}` : paxBreakdown.trimEnd();

        const payload = {
            source: agencyName,
            name: formData.name,
            tour_date: formData.tour_date,
            pax: paxString,
            option: formData.option,
            pickup_location: formData.pickup_location,
            contact: formData.contact,
            note: finalNote,
            status: '예약확정' as ReservationStatus,
            receipt_date: new Date().toISOString().split('T')[0],
            is_reconfirmed: false
        };

        let result;
        if (formMode === 'add') {
            result = await createAgencyReservation(payload);
        } else if (formMode === 'edit' && selectedId) {
            result = await updateAgencyReservation(selectedId, payload);
        }

        if (result?.success) {
            alert(formMode === 'add' ? "성공적으로 예약이 등록되었습니다." : "예약이 성공적으로 수정되었습니다.");
            closeForm();
            fetchReservations();
            
            // 등록/수정된 날짜가 포함된 주간 현황을 다시 갱신하기 위해 임의 트리거 (간단히 재조회)
            const currentStart = availabilityStart;
            setAvailabilityStart("");
            setTimeout(() => setAvailabilityStart(currentStart), 50);

        } else {
            alert(`오류가 발생했습니다: ${result?.error}`);
        }
        setFormLoading(false);
    };

    const handleCancel = async (id: string, name: string) => {
        if (!confirm(`'${name}' 예약자의 예약 취소를 요청하시겠습니까?`)) return;

        const result = await cancelAgencyReservation(id, name);
        if (result.success) {
            alert("취소가 요청되었습니다. 관리자가 승인 시 취소 처리됩니다.");
            fetchReservations();
        } else {
            alert("오류 발생: " + result.error);
        }
    };

    let result = reservations.filter(res => {
        const matchesSearch = searchTerm === "" ||
            res.name.includes(searchTerm) ||
            (res.contact && res.contact.includes(searchTerm)) ||
            (res.pickup_location && res.pickup_location.includes(searchTerm));
        const matchesDate = filterDate === "" || res.tour_date === filterDate;
        return matchesSearch && matchesDate;
    });

    if (sortFilter === "STATUS_CANCELLED") {
        result = result.filter(r => ['취소', '취소요청'].includes(r.status));
    } else if (sortFilter === "STATUS_CONFIRMED") {
        result = result.filter(r => r.status === '예약확정');
    } else if (sortFilter === "STATUS_PENDING") {
        result = result.filter(r => r.status === '예약대기' || r.status === '대기');
    } else if (sortFilter === "TODAY_LIST") {
        const t = new Date();
        const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
        result = result.filter(r => r.tour_date === todayStr);
    } else if (sortFilter === "TOMORROW_LIST") {
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const tomorrowStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
        result = result.filter(r => r.tour_date === tomorrowStr);
    }

    result.sort((a: any, b: any) => {
        if (sortFilter === "TOUR_ASC" || sortFilter.startsWith("STATUS_")) {
            return new Date(a.tour_date).getTime() - new Date(b.tour_date).getTime();
        } else if (sortFilter === "TOUR_DESC") {
            return new Date(b.tour_date).getTime() - new Date(a.tour_date).getTime();
        } else if (sortFilter === "RECEIPT_ASC") {
            return new Date(a.created_at || a.receipt_date || a.tour_date).getTime() - new Date(b.created_at || b.receipt_date || b.tour_date).getTime();
        } else if (sortFilter === "RECEIPT_DESC") {
            return new Date(b.created_at || b.receipt_date || b.tour_date).getTime() - new Date(a.created_at || a.receipt_date || a.tour_date).getTime();
        }
        return 0;
    });

    const filteredReservations = result;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50/50">
            {/* 1. 상단: 주간 현황 위젯 (결과값이 있을때만 렌더링되게 하거나 항상 렌더링) */}
            <div className="shrink-0 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                        <CalIcon className="w-4 h-4 text-indigo-500" /> 주간 예약 가용 현황 (7일)
                    </h3>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-1">
                        <button onClick={() => shiftAvailabilityStart(-7)} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-xs font-bold text-gray-700 px-2 tracking-tight">
                            {availabilityStart.replace(/-/g, '.')} ~ 
                        </span>
                        <button onClick={() => shiftAvailabilityStart(7)} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition text-gray-500"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {availabilityLoading ? (
                        Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="min-w-[140px] flex-1 h-20 bg-gray-100 rounded-lg animate-pulse border border-gray-200"></div>
                        ))
                    ) : availability.length === 0 ? (
                        <div className="w-full text-center py-6 text-sm text-gray-400 font-medium">해당 주간에 등록된 오픈 일정이 없습니다.</div>
                    ) : (
                        availability.map((dayData) => {
                            const d = new Date(dayData.date + 'T12:00:00');
                            const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                            const formattedDate = `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`;

                            const t = new Date();
                            const todayLocal = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                            const isToday = dayData.date === todayLocal;

                            return (
                                <div key={dayData.date} className={`min-w-[130px] flex-1 border ${isToday ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 bg-gray-50'} rounded-lg p-2.5 flex flex-col gap-1.5 shadow-sm`}>
                                    <span className={`text-[11px] font-black ${isToday ? 'text-indigo-700' : 'text-gray-700'} block border-b ${isToday ? 'border-indigo-100' : 'border-gray-200'} pb-1 flex justify-between`}>
                                        {formattedDate}
                                        {isToday && <span className="bg-indigo-600 text-white px-1 py-0.5 rounded-[3px] text-[9px] font-bold leading-none">TODAY</span>}
                                    </span>
                                    <div className="space-y-1 mt-0.5">
                                        {dayData.availability.length === 0 ? (
                                            <div className="text-[10px] text-gray-400 font-bold text-center py-1">일정 없음</div>
                                        ) : (
                                            dayData.availability.map(item => {
                                                let badgeClass = "bg-gray-200 text-gray-700";
                                                if (item.status === "예약 가능") badgeClass = "bg-emerald-100 text-emerald-700";
                                                if (item.status === "마감 임박") badgeClass = "bg-orange-100 text-orange-700";
                                                if (item.status === "마감") badgeClass = "bg-red-100 text-red-700";
                                                if (item.status === "출발 미정") badgeClass = "bg-yellow-100 text-yellow-700";

                                                return (
                                                    <div key={item.option} className="flex justify-between items-center text-[11px]">
                                                        <span className="font-bold text-gray-600 tracking-tight">{item.option}</span>
                                                        <span className={`px-1.5 py-0.5 rounded-[4px] font-bold ${badgeClass}`}>{item.status}</span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 2. 중단 및 하단: 데이터 테이블 컨테이너 */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                
                {/* 툴바 (검색, 날짜 필터, 신규등록) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 gap-4 bg-gray-50/50">
                    <div className="flex flex-1 w-full gap-2 sm:max-w-3xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" placeholder="예약자명, 연락처, 장소 검색..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                            />
                        </div>
                        <input 
                            type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                            className="w-[140px] px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-medium text-gray-700 caret-indigo-600 cursor-text"
                        />
                        <select 
                            value={sortFilter} 
                            onChange={e => setSortFilter(e.target.value)}
                            className="w-[160px] px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-medium text-gray-700"
                        >
                            <option value="TODAY_LIST">⭐ 오늘 명단 (투어일)</option>
                            <option value="TOMORROW_LIST">⭐ 내일 명단 (투어일)</option>
                            <option value="TOUR_ASC">투어날짜 (오름차순)</option>
                            <option value="TOUR_DESC">투어날짜 (내림차순)</option>
                            <option value="RECEIPT_ASC">예약날짜순 (오름차순)</option>
                            <option value="RECEIPT_DESC">예약날짜순 (내림차순)</option>
                            <option value="STATUS_CONFIRMED">예약확정 (보기)</option>
                            <option value="STATUS_CANCELLED">예약취소 (보기)</option>
                            <option value="STATUS_PENDING">예약대기 (보기)</option>
                        </select>
                        {(filterDate || sortFilter !== "TOUR_ASC") && (
                            <button onClick={() => { setFilterDate(""); setSortFilter("TOUR_ASC"); }} className="px-3 text-xs font-bold text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition whitespace-nowrap">초기화</button>
                        )}
                    </div>
                    
                    <button onClick={() => openForm('add')} className="w-full sm:w-auto bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-md flex items-center justify-center gap-1.5 hover:bg-indigo-700 shadow-sm transition-colors active:scale-95">
                        <Plus className="w-4 h-4" /> 새 예약 등록
                    </button>
                </div>

                {/* 테이블 (스크롤 영역) */}
                <div className="flex-1 overflow-auto bg-white relative">
                    <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px]">
                        <thead className="sticky top-0 bg-gray-100/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-b border-gray-200 z-10 text-xs font-bold text-gray-600 uppercase tracking-widest">
                            <tr className="divide-x divide-gray-200">
                                <th className="px-5 py-3 w-24">상태</th>
                                <th className="px-5 py-3 w-32">투어 날짜</th>
                                <th className="px-5 py-3 w-28">옵션</th>
                                <th className="px-5 py-3">예약자명</th>
                                <th className="px-5 py-3 w-24">인원 (성/아/유)</th>
                                <th className="px-5 py-3 truncate max-w-[150px]">픽업장소</th>
                                <th className="px-5 py-3">담당자 연락처</th>
                                <th className="px-5 py-3 text-center w-24">수정/취소</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                // 스켈레톤 로딩 (Skeleton UI)
                                Array.from({ length: 15 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-white divide-x divide-gray-100">
                                        <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-14"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-20 text-center text-gray-500 font-medium bg-gray-50/50">
                                        조회된 예약 데이터가 없습니다. 상단의 '새 예약 등록' 버튼을 눌러주세요.
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map(res => {
                                    const isCancelled = ['취소', '취소요청'].includes(res.status);
                                    let statusColor = "bg-gray-100 text-gray-700";
                                    if(res.status === '예약확정') statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                                    if(isCancelled) statusColor = "bg-red-50 text-red-600 border-red-100 line-through";

                                    return (
                                        <tr key={res.id} className={`hover:bg-indigo-50/40 transition-colors group ${isCancelled ? 'bg-red-50/10 opacity-70' : 'bg-white'} divide-x divide-gray-100`}>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold border ${statusColor}`}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-bold text-gray-800 tracking-tight">{res.tour_date.replace(/-/g, '.')}</td>
                                            <td className="px-5 py-3 font-bold text-indigo-700">{res.option}</td>
                                            <td className="px-5 py-3 font-bold text-gray-900">{res.name}</td>
                                            <td className="px-5 py-3 text-gray-600 text-xs font-medium">{res.pax}</td>
                                            <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]" title={res.pickup_location}>{res.pickup_location}</td>
                                            <td className="px-5 py-3 text-gray-600 text-xs font-medium font-mono">{res.contact}</td>
                                            <td className="px-5 py-2 text-center flex items-center justify-center gap-1.5 min-w-[100px]">
                                                {!isCancelled && (
                                                    <>
                                                        <button onClick={() => openForm('edit', res)} className="px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded transition" title="수정">수정</button>
                                                        <button onClick={() => handleCancel(res.id, res.name)} className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded transition" title="취소 요청">취소</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* 테이블 푸터 바 (카운트) */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 flex justify-between">
                    <span>총 {filteredReservations.length} 건</span>
                    <span>가로로 스크롤하여 더 많은 정보를 볼 수 있습니다.</span>
                </div>
            </div>

            {/* 3. 모달 / 슬라이드오버 폼 (Slide-over form) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Dim Backdrop */}
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={closeForm}></div>
                    
                    {/* Slide Panel */}
                    <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200">
                        {/* Form Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{formMode === 'add' ? '새 예약 등록' : '예약 정보 수정'}</h2>
                                <p className="text-xs text-gray-500 mt-0.5">선택한 날짜의 인원 마감을 주의하세요.</p>
                            </div>
                            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-900 p-1.5 rounded-full hover:bg-gray-200 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Form Body Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                            <form id="reservation-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-gray-700">여행사명 (고정)</label>
                                    <input readOnly value={agencyName} className="w-full text-sm p-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-gray-700">예약자명 <span className="text-red-500">*</span></label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="대표자 이름 (예: 홍길동)"
                                        className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold text-gray-700">투어 날짜 <span className="text-red-500">*</span></label>
                                        <input required type="date" value={formData.tour_date} onChange={e => setFormData({ ...formData, tour_date: e.target.value })}
                                            className="w-full text-sm font-medium p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition caret-indigo-600 cursor-text" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold text-gray-700">투어 옵션 <span className="text-red-500">*</span></label>
                                        <select value={formData.option} onChange={e => setFormData({ ...formData, option: e.target.value })}
                                            className="w-full text-sm font-medium p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
                                        >
                                            <option value="1부">1부</option>
                                            <option value="2부">2부</option>
                                            <option value="선셋">선셋</option>
                                            <option value="프라이빗">프라이빗</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-800 mb-3">탑승 인원 <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['adults', 'children', 'infants'].map((type, idx) => {
                                            const labels = ["성인", "아동", "유아"];
                                            const key = type as keyof typeof formData;
                                            return (
                                                <div key={type} className="text-center">
                                                    <span className="block text-xs font-bold text-gray-600 mb-1">{labels[idx]}</span>
                                                    <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden h-9">
                                                        <button type="button" onClick={() => setFormData(f => ({...f, [key]: Math.max(0, Number(f[key]) - 1)}))} className="w-8 h-full bg-gray-50 hover:bg-gray-100 font-bold border-r border-gray-200 text-gray-500">-</button>
                                                        <input type="text" inputMode="numeric" value={formData[key].toString()} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setFormData(f => ({ ...f, [key]: val === '' ? 0 : parseInt(val, 10) })) }} className="flex-1 w-full text-center text-sm font-bold outline-none" />
                                                        <button type="button" onClick={() => setFormData(f => ({...f, [key]: Number(f[key]) + 1}))} className="w-8 h-full bg-gray-50 hover:bg-gray-100 font-bold border-l border-gray-200 text-gray-500">+</button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-gray-700">픽업 위치 <span className="text-red-500">*</span></label>
                                    <input required value={formData.pickup_location} onChange={e => setFormData({ ...formData, pickup_location: e.target.value })}
                                        placeholder="정확한 호텔명 입력"
                                        className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-gray-700">담당자 인솔(연락처) <span className="text-red-500">*</span></label>
                                    <input required value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        placeholder="가이드 이름 및 연락처 정보"
                                        className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-gray-700">기타 메모 작성</label>
                                    <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        placeholder="특이사항, 아이 나이, 요청사항 등..." rows={3}
                                        className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none custom-scrollbar" />
                                </div>
                            </form>
                        </div>
                        
                        {/* Form Footer */}
                        <div className="p-5 border-t border-gray-200 bg-gray-50 flex gap-3">
                            <button type="button" onClick={closeForm} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">취소</button>
                            <button type="submit" form="reservation-form" disabled={formLoading} className="flex-[2] py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg flex justify-center items-center gap-2 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '저장 완료 (마감 점검)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
