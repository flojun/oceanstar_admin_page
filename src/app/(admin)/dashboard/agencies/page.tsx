"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Agency } from "@/types/agency";
import { Loader2, Plus, Trash2, Edit2, Copy, ExternalLink } from "lucide-react";

export default function AgencyManagementPage() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', login_id: '', password: '' });
    const [formLoading, setFormLoading] = useState(false);

    const fetchAgencies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("agencies")
            .select("id, name, login_id, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            alert("여행사 목록을 불러오지 못했습니다.");
        } else {
            setAgencies(data as Agency[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAgencies();
    }, []);

    const handleOpenModal = (mode: 'add' | 'edit', agency?: Agency) => {
        setModalMode(mode);
        if (agency) {
            setSelectedAgency(agency);
            setFormData({ name: agency.name, login_id: agency.login_id, password: '' }); // Password not fetched
        } else {
            setSelectedAgency(null);
            setFormData({ name: '', login_id: '', password: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', login_id: '', password: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.login_id) return alert("필수 항목을 입력해주세요.");
        if (modalMode === 'add' && !formData.password) return alert("비밀번호를 입력해주세요.");

        setFormLoading(true);
        if (modalMode === 'add') {
            const { error } = await supabase.from("agencies").insert({
                name: formData.name,
                login_id: formData.login_id,
                password: formData.password
            });
            if (error) {
                if (error.code === '23505') alert("이미 존재하는 아이디입니다.");
                else alert("추가 실패: " + error.message);
            } else {
                fetchAgencies();
                handleCloseModal();
            }
        } else if (modalMode === 'edit' && selectedAgency) {
            const updates: any = { name: formData.name, login_id: formData.login_id };
            if (formData.password) updates.password = formData.password; // Only update if provided

            const { error } = await supabase.from("agencies").update(updates).eq('id', selectedAgency.id);
            if (error) {
                if (error.code === '23505') alert("이미 존재하는 아이디입니다.");
                else alert("수정 실패: " + error.message);
            } else {
                fetchAgencies();
                handleCloseModal();
            }
        }
        setFormLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`정말로 '${name}' 여행사를 삭제하시겠습니까? 관련 예약의 agency_id는 null로 처리됩니다.`)) return;

        const { error } = await supabase.from("agencies").delete().eq('id', id);
        if (error) {
            alert("삭제 실패: " + error.message);
        } else {
            fetchAgencies();
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">여행사 계정 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">여행사 전용 포털(B2B) 접속 계정을 관리합니다.</p>
                </div>
                <button
                    onClick={() => handleOpenModal('add')}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    새 여행사 등록
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-blue-900 font-bold mb-1 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        여행사 전용 접속 주소
                    </h3>
                    <p className="text-blue-700/80 text-sm">여행사 담당자에게 아래 주소와 발급한 아이디/비밀번호를 전달해주세요.</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-blue-200 shadow-sm w-full sm:w-auto">
                    <code className="text-gray-700 font-mono text-sm flex-1">
                        {typeof window !== 'undefined' ? `${window.location.origin}/agency-login` : '/agency-login'}
                    </code>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/agency-login`);
                            alert('주소가 복사되었습니다.');
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition"
                        title="주소 복사"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <a
                        href="/agency-login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm ml-2 px-2 py-1 rounded hover:bg-blue-50 transition"
                    >
                        새 창으로 열기 &rarr;
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200/80">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">여행사명</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">로그인 아이디</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">등록일</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 w-24">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    로딩 중...
                                </td>
                            </tr>
                        ) : agencies.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    등록된 여행사 계정이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            agencies.map((agency) => (
                                <tr key={agency.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900">{agency.name}</td>
                                    <td className="px-6 py-4 text-gray-600 font-mono bg-blue-50/30 rounded inline-block mt-2 px-2 py-1 ml-4 border border-blue-100">{agency.login_id}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(agency.created_at).toLocaleDateString('ko-KR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal('edit', agency)}
                                                className="text-gray-400 hover:text-blue-600 transition" title="수정"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(agency.id, agency.name)}
                                                className="text-gray-400 hover:text-red-500 transition" title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {modalMode === 'add' ? '새 여행사 등록' : '여행사 정보 수정'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">여행사명</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="예: 모두투어"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">로그인 아이디</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.login_id}
                                    onChange={e => setFormData({ ...formData, login_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="로그인에 사용할 영문/숫자 아이디"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    비밀번호 {modalMode === 'edit' && <span className="text-gray-400 font-normal">(변경 시에만 입력)</span>}
                                </label>
                                <input
                                    type="password"
                                    required={modalMode === 'add'}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder={modalMode === 'add' ? "초기 비밀번호 입력" : "변경할 비밀번호 입력"}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex justify-center items-center"
                                >
                                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
