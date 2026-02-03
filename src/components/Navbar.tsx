"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "@/components/providers/UnsavedChangesProvider";

const TABS = [
    { name: "명단보기", href: "/dashboard/list" },
    { name: "차량용 명단", href: "/dashboard/vehicle" },
    { name: "캘린더", href: "/dashboard/monthly" },
    { name: "예약관리", href: "/dashboard/all" },
    { name: "엑셀등록", href: "/dashboard/bulk-add" },
];

export default function Navbar() {
    const pathname = usePathname();
    const { handleNavigationAttempt } = useUnsavedChanges();

    return (
        <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/80 backdrop-blur-md shadow-sm shrink-0">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">O C E A N S T A R</h1>
                    <nav className="hidden space-x-2 md:flex">
                        {TABS.map((tab) => {
                            const isActive = pathname === tab.href;
                            return (
                                <button
                                    key={tab.href}
                                    onClick={() => handleNavigationAttempt(tab.href)}
                                    className={cn(
                                        "rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-200",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                            : "bg-transparent text-blue-400 hover:bg-blue-50 hover:text-blue-700"
                                    )}
                                >
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>
                {/* Mobile Menu Fallback could go here */}
            </div>

            {/* Mobile Tab Scroller */}
            <div className="flex overflow-x-auto border-t border-blue-50 px-4 py-3 md:hidden space-x-2 bg-blue-50/50">
                {TABS.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <button
                            key={tab.href}
                            onClick={() => handleNavigationAttempt(tab.href)}
                            className={cn(
                                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-all",
                                isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-white text-blue-400 hover:bg-blue-50"
                            )}
                        >
                            {tab.name}
                        </button>
                    );
                })}
            </div>
        </header>
    );
}
