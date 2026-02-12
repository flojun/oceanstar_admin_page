"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);
    const router = useRouter();

    // On mount, check if device was previously remembered
    useEffect(() => {
        const remembered = localStorage.getItem("remember-device");
        if (remembered) {
            const expiry = parseInt(remembered, 10);
            if (Date.now() < expiry) {
                setRememberDevice(true);
            } else {
                // Expired, clean up
                localStorage.removeItem("remember-device");
            }
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Append dummy domain to create email
            const email = `${username}@oceanstar.com`;

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                alert("로그인 실패: 아이디 또는 비밀번호를 확인해주세요.");
            } else {
                if (rememberDevice) {
                    // Remember for 24 hours
                    const expiry = Date.now() + 24 * 60 * 60 * 1000;
                    localStorage.setItem("remember-device", String(expiry));
                } else {
                    // Don't remember — clear any previous remember flag
                    localStorage.removeItem("remember-device");
                }
                router.push("/dashboard/home");
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("로그인 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-blue-600">O C E A N S T A R</h1>
                    <p className="text-gray-500 mt-2 text-sm">관리자 로그인</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="admin"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember-device"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="remember-device" className="text-sm text-gray-600 cursor-pointer select-none">
                            이 기기 기억하기 (24시간)
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>
            </div>
        </div>
    );
}
