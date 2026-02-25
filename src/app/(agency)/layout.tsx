"use client";

import { usePathname, useRouter } from "next/navigation";
import { logoutAgency } from "@/actions/agency";
import { LogOut, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getAgencySession } from "@/actions/agency";

export default function AgencyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === "/agency-login";
    const [agencyName, setAgencyName] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoginPage) {
            getAgencySession().then(session => {
                if (session.name) setAgencyName(session.name);
            });
        }
    }, [isLoginPage]);

    const handleLogout = async () => {
        await logoutAgency();
        router.push("/agency-login");
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            {!isLoginPage && (
                <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-blue-700 tracking-tight flex items-center gap-2">
                                    OCEANSTAR
                                </h1>
                                <p className="text-[10px] sm:text-sm font-semibold text-gray-500 mt-0.5 sm:mt-1">
                                    여행사 전용 파트너 시스템
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            {agencyName && (
                                <div className="flex items-center gap-1 sm:gap-2 text-gray-700 font-bold bg-blue-50 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full border border-blue-100 text-xs sm:text-base max-w-[120px] sm:max-w-none truncate">
                                    <UserCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                                    <span className="truncate">{agencyName}</span>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-bold text-sm sm:text-lg transition-colors bg-gray-100 hover:bg-red-50 px-3 sm:px-4 py-2 rounded-xl"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden sm:inline">로그아웃</span>
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
