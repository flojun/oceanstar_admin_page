"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ship } from "lucide-react";
import { loginAgency } from "@/actions/agency";

export default function AgencyLoginPage() {
    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await loginAgency(loginId, password);

        if (res.success) {
            router.push("/agency-dashboard");
        } else {
            alert(res.error || "로그인에 실패했습니다.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 sm:p-12">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 p-4 sm:p-5 rounded-full text-blue-600">
                        <Ship className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                </div>
                <div className="text-center mb-8 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 tracking-tight">OCEANSTAR</h1>
                    <p className="text-lg sm:text-xl text-gray-500 mt-2 sm:mt-3 font-semibold">여행사 전용 예약 시스템</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    <div>
                        <label className="block text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                            아이디
                        </label>
                        <input
                            type="text"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            className="w-full p-4 sm:p-5 text-lg sm:text-xl bg-gray-50 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all placeholder-gray-400"
                            placeholder="아이디를 입력하세요"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 sm:p-5 text-lg sm:text-xl bg-gray-50 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all placeholder-gray-400"
                            placeholder="비밀번호를 입력하세요"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 sm:py-5 rounded-2xl text-xl sm:text-2xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 mt-4"
                    >
                        {loading && <Loader2 className="w-8 h-8 animate-spin" />}
                        {loading ? "로그인 중..." : "로그인 하기"}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                    <p className="text-lg text-gray-500">
                        문의: <span className="font-bold text-gray-700">010-0000-0000</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
