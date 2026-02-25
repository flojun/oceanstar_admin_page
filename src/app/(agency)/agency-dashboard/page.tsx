"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation, ReservationStatus } from "@/types/reservation";
import { createAgencyReservation, updateAgencyReservation, cancelAgencyReservation } from "@/actions/agency";
import { Loader2, PlusCircle, Calendar as CalIcon, Edit, Trash2, ChevronDown, Search } from "lucide-react";

export default function AgencyDashboardPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterDate, setFilterDate] = useState("");

    const [activeTab, setActiveTab] = useState<'registration' | 'date_view'>('registration');

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
        // We will fetch based on agency_id. Using RLS or simply filtering. 
        // For security in client, RLS should verify agency_id, but here we can just fetch all that belongs to them if RLS is set,
        // or we call a server action. Let's fetch directly assuming RLS allows them via the cookie session (which is tricky for standard Supabase client if not using custom JWT).
        // Since we are using cookies for agency session, the Supabase client here is technically ANON.
        // Wait, standard supabase client won't know the agency_session cookie automatically for RLS.
        // We need to fetch via API or Server Action! 

        // As a quick workaround, we can use a server action to fetch reservations safely.
        // But let's build the server action `fetchAgencyReservations` first, or we can just fetch all here and filter if it's admin, but it's not.
        const res = await fetch('/api/agency/reservations');
        if (res.ok) {
            const data = await res.json();
            setReservations(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReservations();

        // Fetch agency name from cookies or API for the Source field
        const getAgencyContext = async () => {
            const { getAgencySession } = await import('@/actions/agency');
            const session = await getAgencySession();
            if (session.name) setAgencyName(session.name);
        };
        getAgencyContext();
    }, []);

    const openForm = (mode: 'add' | 'edit', res?: Reservation) => {
        setFormMode(mode);
        if (mode === 'edit' && res) {
            setSelectedId(res.id);
            // Extract pax if possible for editor, though tricky from a single string.
            // For now, we'll extract numbers if it matches our pattern (성X, 아Y, 유Z), otherwise default 2/0/0
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
                note: res.note?.replace(/\(성\d+, 아\d+, 유\d+\)\s*/g, '') || "" // Remove the auto-tag from note string for editing
            });
        } else {
            setSelectedId(null);
            setFormData(initialForm);
        }
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setFormData(initialForm);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        // Calculate Pax logic
        const totalPax = formData.adults + formData.children + formData.infants;
        const paxString = `${totalPax}명`;

        // Add breakdown to note
        const paxBreakdown = `(성${formData.adults}, 아${formData.children}, 유${formData.infants}) `;
        const finalNote = formData.note ? `${paxBreakdown}${formData.note}` : paxBreakdown.trimEnd();

        const payload = {
            source: agencyName, // Always fixed to their agency name
            name: formData.name,
            tour_date: formData.tour_date,
            pax: paxString,
            option: formData.option,
            pickup_location: formData.pickup_location,
            contact: formData.contact,
            note: finalNote,
            status: '예약확정' as ReservationStatus,
            receipt_date: new Date().toISOString().split('T')[0], // today
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
        } else {
            alert(`오류가 발생했습니다: ${result?.error}`);
        }
        setFormLoading(false);
    };

    const handleCancel = async (id: string, name: string) => {
        if (!confirm(`'${name}' 예약자의 예약을 정말 취소(요청)하시겠습니까?`)) return;

        const result = await cancelAgencyReservation(id, name);
        if (result.success) {
            alert("예약 취소가 요청되었습니다. 관리자가 확인 후 최종 취소 처리합니다.");
            fetchReservations();
        } else {
            alert("오류 발생: " + result.error);
        }
    };

    // 필터링 적용된 예약 목록 계산
    const filteredReservations = reservations.filter(res => {
        const matchesSearch = searchTerm === "" ||
            res.name.includes(searchTerm) ||
            (res.contact && res.contact.includes(searchTerm)) ||
            (res.pickup_location && res.pickup_location.includes(searchTerm));

        const matchesDate = filterDate === "" || res.tour_date === filterDate;

        return matchesSearch && matchesDate;
    });

    return (
        <div className="space-y-6 sm:space-y-8 pb-32">

            {/* 상단 탭 네비게이션 */}
            <div className="flex bg-white rounded-2xl sm:rounded-3xl p-2 shadow-sm border-2 border-gray-100 mb-4 sm:mb-8">
                <button
                    onClick={() => { setActiveTab('registration'); setIsFormOpen(false); }}
                    className={`flex-1 py-3 sm:py-4 text-center text-lg sm:text-2xl font-bold rounded-xl sm:rounded-2xl transition-all ${activeTab === 'registration' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    예약 등록 및 현황
                </button>
                <button
                    onClick={() => { setActiveTab('date_view'); setIsFormOpen(false); }}
                    className={`flex-1 py-3 sm:py-4 text-center text-lg sm:text-2xl font-bold rounded-xl sm:rounded-2xl transition-all ${activeTab === 'date_view' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    날짜별 보기
                </button>
            </div>

            {activeTab === 'registration' && !isFormOpen && (
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-blue-50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100 shadow-sm">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">예약 현황</h2>
                        <p className="text-lg sm:text-xl text-blue-700 mt-1 sm:mt-2 font-medium">등록하신 예약 목록을 확인하세요.</p>
                    </div>
                    <button
                        onClick={() => openForm('add')}
                        className="w-full sm:w-auto bg-blue-600 text-white text-xl sm:text-2xl font-bold px-6 sm:px-8 py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-blue-700 shadow-xl transition-transform active:scale-95"
                    >
                        <PlusCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                        새 예약 등록하기
                    </button>
                </div>
            )}

            {activeTab === 'registration' && isFormOpen && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-blue-600 p-5 sm:p-6">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                            {formMode === 'add' ? '새 예약 정보 입력' : '예약 정보 수정'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

                            {/* 경로 - Read Only */}
                            <div className="space-y-2 sm:space-y-3">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800">경로 (여행사명)</label>
                                <input readOnly value={agencyName}
                                    className="w-full text-lg sm:text-2xl p-3 sm:p-4 border-2 border-gray-200 bg-gray-100 text-gray-600 rounded-xl outline-none cursor-not-allowed" />
                            </div>

                            {/* 예약자명 */}
                            <div className="space-y-2 sm:space-y-3">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800">예약자명 <span className="text-red-500">*</span></label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="예: 홍길동"
                                    className="w-full text-lg sm:text-2xl p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition" />
                            </div>

                            {/* 예약일 (투어일) */}
                            <div className="space-y-2 sm:space-y-3 md:col-span-2 bg-blue-50 p-4 sm:p-6 rounded-2xl border border-blue-100">
                                <label className="block text-xl sm:text-2xl font-bold text-blue-900">투어 진행 날짜 <span className="text-red-500">*</span></label>
                                <input required type="date" value={formData.tour_date} onChange={e => setFormData({ ...formData, tour_date: e.target.value })}
                                    className="w-full text-2xl sm:text-3xl font-bold p-4 sm:p-5 border-2 border-blue-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 outline-none text-blue-900 bg-white" />
                            </div>

                            {/* 인원 (세분화) */}
                            <div className="space-y-2 sm:space-y-3 md:col-span-2 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">인원 수 <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                    <div className="text-center">
                                        <label className="block text-lg sm:text-xl font-bold text-gray-600 mb-1 sm:mb-2">성인</label>
                                        <div className="flex flex-col sm:flex-row items-center bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
                                            <button type="button" onClick={() => setFormData(f => ({ ...f, adults: f.adults + 1 }))} className="order-1 sm:order-3 w-full sm:w-12 md:w-16 p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 text-xl sm:text-2xl font-bold transition flex-shrink-0 border-b-2 sm:border-b-0 sm:border-l-2 border-gray-200">+</button>
                                            <input type="text" inputMode="numeric" value={formData.adults.toString()} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setFormData(f => ({ ...f, adults: val === '' ? 0 : parseInt(val, 10) })) }} className="order-2 sm:order-2 w-full text-center text-xl sm:text-2xl font-bold focus:outline-none min-w-0 py-2 sm:py-0" />
                                            <button type="button" onClick={() => setFormData(f => ({ ...f, adults: Math.max(0, f.adults - 1) }))} className="order-3 sm:order-1 w-full sm:w-12 md:w-16 p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 text-xl sm:text-2xl font-bold transition flex-shrink-0 border-t-2 sm:border-t-0 sm:border-r-2 border-gray-200">-</button>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-lg sm:text-xl font-bold text-gray-600 mb-1 sm:mb-2">아동</label>
                                        <div className="flex flex-col sm:flex-row items-center bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
                                            <button type="button" onClick={() => setFormData(f => ({ ...f, children: f.children + 1 }))} className="order-1 sm:order-3 w-full sm:w-12 md:w-16 p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 text-xl sm:text-2xl font-bold transition flex-shrink-0 border-b-2 sm:border-b-0 sm:border-l-2 border-gray-200">+</button>
                                            <input type="text" inputMode="numeric" value={formData.children.toString()} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setFormData(f => ({ ...f, children: val === '' ? 0 : parseInt(val, 10) })) }} className="order-2 sm:order-2 w-full text-center text-xl sm:text-2xl font-bold focus:outline-none min-w-0 py-2 sm:py-0" />
                                            <button type="button" onClick={() => setFormData(f => ({ ...f, children: Math.max(0, f.children - 1) }))} className="order-3 sm:order-1 w-full sm:w-12 md:w-16 p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 text-xl sm:text-2xl font-bold transition flex-shrink-0 border-t-2 sm:border-t-0 sm:border-r-2 border-gray-200">-</button>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-lg sm:text-xl font-bold text-gray-600 mb-1 sm:mb-2">유아</label>
                                        <div className="flex flex-col sm:flex-row items-center bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
                                            <button type="button" onClick={() => setFormData(f => ({ ...f, infants: f.infants + 1 }))} className="order-1 sm:order-3 w-full sm:w-12 md:w-16 p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 text-xl sm:text-2xl font-bold transition flex-shrink-0 border-b-2 sm:border-b-0 sm:border-l-2 border-gray-200">+</button>
                                            <input type="text" inputMode="numeric" value={formData.infants.toString()} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setFormData(f => ({ ...f, infants: val === '' ? 0 : parseInt(val, 10) })) }} className="order-2 sm:order-2 w-full text-center text-xl sm:text-2xl font-bold focus:outline-none min-w-0 py-2 sm:py-0" />
                                            <button type="button" onClick={() => setFormData(f => ({ ...f, infants: Math.max(0, f.infants - 1) }))} className="order-3 sm:order-1 w-full sm:w-12 md:w-16 p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 text-xl sm:text-2xl font-bold transition flex-shrink-0 border-t-2 sm:border-t-0 sm:border-r-2 border-gray-200">-</button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-right text-base sm:text-lg text-gray-500 mt-2 sm:mt-3 font-semibold">총 인원: <span className="text-blue-600 font-bold">{formData.adults + formData.children + formData.infants}명</span></p>
                            </div>

                            {/* 옵션 Dropdown */}
                            <div className="space-y-2 sm:space-y-3">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800">투어 옵션 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        value={formData.option}
                                        onChange={e => setFormData({ ...formData, option: e.target.value })}
                                        className="w-full text-lg sm:text-2xl p-3 sm:p-4 pr-12 sm:pr-14 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition bg-white appearance-none"
                                    >
                                        <option value="1부">1부</option>
                                        <option value="2부">2부</option>
                                        <option value="선셋">선셋</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                                    </div>
                                </div>
                            </div>

                            {/* 픽업장소 */}
                            <div className="space-y-2 sm:space-y-3">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800">픽업 호텔 / 장소 <span className="text-red-500">*</span></label>
                                <input required value={formData.pickup_location} onChange={e => setFormData({ ...formData, pickup_location: e.target.value })}
                                    placeholder="정확한 호텔명을 입력해주세요"
                                    className="w-full text-lg sm:text-2xl p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition" />
                            </div>

                            {/* 연락처 / 담당가이드 */}
                            <div className="space-y-2 sm:space-y-3">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800">담당 가이드 혹은 연락처 <span className="text-red-500">*</span></label>
                                <input required value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    placeholder="예: 김가이드 혹은 010-1234-5678"
                                    className="w-full text-lg sm:text-2xl p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition" />
                            </div>

                            {/* 기타사항 */}
                            <div className="space-y-2 sm:space-y-3 md:col-span-2">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800">기타 전달사항</label>
                                <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="특별 요청사항이나 메모를 남겨주세요."
                                    rows={4}
                                    className="w-full text-lg sm:text-2xl p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition resize-none" />
                            </div>
                        </div>

                        <div className="mt-8 sm:mt-12 flex flex-col-reverse md:flex-row gap-4 sm:gap-6">
                            <button type="button" onClick={closeForm}
                                className="w-full md:w-1/3 py-4 sm:py-5 text-xl sm:text-2xl font-bold text-gray-600 bg-gray-100 rounded-2xl border-2 border-gray-200 hover:bg-gray-200 active:bg-gray-300 transition-colors">
                                취소하고 돌아가기
                            </button>
                            <button type="submit" disabled={formLoading}
                                className="w-full md:w-2/3 py-4 sm:py-5 text-xl sm:text-2xl font-bold text-white bg-blue-600 rounded-2xl flex justify-center items-center gap-2 sm:gap-3 hover:bg-blue-700 active:bg-blue-800 shadow-xl transition-colors disabled:opacity-50">
                                {formLoading ? <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" /> : (formMode === 'add' ? '이 정보로 예약 등록하기' : '수정된 정보 저장하기')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List for Registration Tab */}
            {activeTab === 'registration' && !isFormOpen && (
                <div className="space-y-6 sm:space-y-8">

                    {/* 검색 및 필터 바 */}
                    {!loading && reservations.length > 0 && (
                        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
                            {/* 검색어 입력 */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="예약자명, 연락처, 장소 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 sm:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg sm:text-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                            </div>
                            {/* 날짜 필터 */}
                            <div className="md:w-64 relative">
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full px-4 py-3 sm:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg sm:text-xl font-medium text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                                {filterDate && (
                                    <button
                                        onClick={() => setFilterDate("")}
                                        className="absolute right-12 top-1/2 -translate-y-1/2 text-sm sm:text-base text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100"
                                    >
                                        전체
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-20 flex justify-center items-center">
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                            <span className="ml-4 text-3xl font-bold text-blue-800">목록을 불러오는 중입니다...</span>
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-200 border-dashed">
                            <CalIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-3xl font-bold text-gray-500">아직 등록된 예약이 없습니다.</h3>
                            <p className="text-xl text-gray-400 mt-4">오른쪽 위의 '새 예약 등록하기' 버튼을 눌러보세요.</p>
                        </div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-200 border-dashed">
                            <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-3xl font-bold text-gray-500">검색 결과가 없습니다.</h3>
                            <p className="text-xl text-gray-400 mt-4">검색어와 날짜를 다시 확인해주세요.</p>
                        </div>
                    ) : (
                        filteredReservations.map(res => (
                            <div key={res.id} className={`bg-white rounded-lg p-4 sm:p-5 border-l-4 ${['취소', '취소요청'].includes(res.status) ? 'border-red-400 bg-red-50/30' : 'border-blue-500 shadow-sm'} transition-shadow hover:shadow-md`}>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
                                    <div className="space-y-3 flex-1 min-w-0 flex flex-col justify-center">
                                        {/* 뱃지 영역 - 사각형 뱃지 (날짜 & 상태) */}
                                        <div className="flex items-center gap-2 flex-wrap border-b border-gray-100 pb-2">
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs sm:text-sm font-bold text-blue-800">
                                                <CalIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {res.tour_date}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs sm:text-sm font-bold ml-2 ${['취소', '취소요청'].includes(res.status) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                        {/* 텍스트 영역 (이름, 인원수, 옵션, 픽업) */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                                            <span className="text-lg sm:text-xl font-extrabold text-gray-900 shrink-0 leading-none mt-0.5">
                                                {res.name}
                                            </span>
                                            <span className="text-gray-300 text-lg sm:text-xl leading-none mt-0.5">|</span>
                                            <span className="text-lg sm:text-xl text-blue-600 font-bold shrink-0 leading-none mt-0.5">
                                                {res.pax}
                                            </span>
                                            <span className="text-gray-300 text-lg sm:text-xl leading-none mt-0.5">|</span>
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-lg sm:text-xl font-bold text-gray-700 border border-gray-200 rounded-md shrink-0 bg-gray-50 leading-none mt-0.5">
                                                {res.option}
                                            </span>
                                            <span className="text-gray-300 text-lg sm:text-xl leading-none mt-0.5">|</span>
                                            <div className="text-lg sm:text-xl text-gray-800 flex-1 flex items-center min-w-0">
                                                <span className="inline-flex items-center justify-center bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-sm sm:text-base mr-2 font-bold shrink-0 leading-none mt-0.5">픽업</span>
                                                <span className="truncate leading-none mt-0.5 font-bold">{res.pickup_location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 버튼 영역 (위아래 배치) */}
                                    {!['취소', '취소요청'].includes(res.status) && (
                                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-24 mt-2 sm:mt-0 pt-3 sm:pt-0 sm:pl-4 shrink-0 sm:border-l border-gray-100 border-t sm:border-t-0 justify-center">
                                            <button
                                                onClick={() => openForm('edit', res)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 p-2 text-sm font-bold text-gray-600 bg-gray-50 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100">
                                                <Edit className="w-4 h-4" /> 수정
                                            </button>
                                            <button
                                                onClick={() => handleCancel(res.id, res.name)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 p-2 text-sm font-bold text-red-500 bg-red-50 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
                                                <Trash2 className="w-4 h-4" /> 삭제
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 날짜별 보기 탭 */}
            {activeTab === 'date_view' && (
                <div className="space-y-6 sm:space-y-8">
                    {/* 날짜 필수 선택 바 (검색 제외) */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-sm flex flex-col items-center justify-center">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">조회하실 날짜를 선택해주세요</h3>
                        <div className="w-full max-w-md relative">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-6 py-4 sm:py-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-xl sm:text-2xl font-bold text-blue-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition text-center"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 flex justify-center items-center">
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                            <span className="ml-4 text-3xl font-bold text-blue-800">목록을 불러오는 중입니다...</span>
                        </div>
                    ) : filterDate === "" ? (
                        <div className="bg-white rounded-3xl p-16 text-center border-2 border-blue-100 border-dashed">
                            <CalIcon className="w-20 h-20 text-blue-300 mx-auto mb-6" />
                            <h3 className="text-3xl font-bold text-blue-800">날짜를 선택해 주세요</h3>
                            <p className="text-xl text-blue-600 mt-4">원하시는 투어 진행 날짜를 선택하시면 해당 예약건들이 보입니다.</p>
                        </div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-200 border-dashed">
                            <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-3xl font-bold text-gray-500">선택하신 날짜에 예약이 없습니다.</h3>
                        </div>
                    ) : (
                        filteredReservations.map(res => (
                            <div key={res.id} className={`bg-white rounded-lg p-4 sm:p-5 border-l-4 ${['취소', '취소요청'].includes(res.status) ? 'border-red-400 bg-red-50/30' : 'border-blue-500 shadow-sm'} transition-shadow hover:shadow-md`}>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
                                    <div className="space-y-3 flex-1 min-w-0 flex flex-col justify-center">
                                        {/* 뱃지 영역 - 사각형 뱃지 (날짜 & 상태) */}
                                        <div className="flex items-center gap-2 flex-wrap border-b border-gray-100 pb-2">
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs sm:text-sm font-bold text-blue-800">
                                                <CalIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {res.tour_date}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs sm:text-sm font-bold ml-2 ${['취소', '취소요청'].includes(res.status) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                        {/* 텍스트 영역 (이름, 인원수, 옵션, 픽업) */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                                            <span className="text-lg sm:text-xl font-extrabold text-gray-900 shrink-0 leading-none mt-0.5">
                                                {res.name}
                                            </span>
                                            <span className="text-gray-300 text-lg sm:text-xl leading-none mt-0.5">|</span>
                                            <span className="text-lg sm:text-xl text-blue-600 font-bold shrink-0 leading-none mt-0.5">
                                                {res.pax}
                                            </span>
                                            <span className="text-gray-300 text-lg sm:text-xl leading-none mt-0.5">|</span>
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-lg sm:text-xl font-bold text-gray-700 border border-gray-200 rounded-md shrink-0 bg-gray-50 leading-none mt-0.5">
                                                {res.option}
                                            </span>
                                            <span className="text-gray-300 text-lg sm:text-xl leading-none mt-0.5">|</span>
                                            <div className="text-lg sm:text-xl text-gray-800 flex-1 flex items-center min-w-0">
                                                <span className="inline-flex items-center justify-center bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-sm sm:text-base mr-2 font-bold shrink-0 leading-none mt-0.5">픽업</span>
                                                <span className="truncate leading-none mt-0.5 font-bold">{res.pickup_location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 버튼 영역 (위아래 배치) */}
                                    {!['취소', '취소요청'].includes(res.status) && (
                                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-24 mt-2 sm:mt-0 pt-3 sm:pt-0 sm:pl-4 shrink-0 sm:border-l border-gray-100 border-t sm:border-t-0 justify-center">
                                            <button
                                                onClick={() => openForm('edit', res)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 p-2 text-sm font-bold text-gray-600 bg-gray-50 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100">
                                                <Edit className="w-4 h-4" /> 수정
                                            </button>
                                            <button
                                                onClick={() => handleCancel(res.id, res.name)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 p-2 text-sm font-bold text-red-500 bg-red-50 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
                                                <Trash2 className="w-4 h-4" /> 삭제
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
