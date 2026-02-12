"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UnsavedChangesProvider, useUnsavedChanges } from "@/components/providers/UnsavedChangesProvider";
import { supabase } from "@/lib/supabase";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Car,
    ListChecks,
    LogOut,
    Menu,
    X,
    ClipboardList,
    Anchor,
    ChevronLeft,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";
import { useState, useEffect } from "react";

const SIDEBAR_ITEMS = [
    { name: "홈", href: "/dashboard/home", icon: LayoutDashboard },
    { name: "명단보기", href: "/dashboard/list", icon: ListChecks },
    { name: "차량용 명단", href: "/dashboard/vehicle", icon: Car },
    { name: "캘린더", href: "/dashboard/monthly", icon: Calendar },
    { name: "예약관리", href: "/dashboard/all", icon: ClipboardList },
    { name: "크루 스케쥴", href: "/dashboard/crew", icon: Anchor },
    { name: "대시보드", href: "/dashboard/stats", icon: Users },
];

function AdminSidebar({
    isCollapsed,
    toggleSidebar
}: {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { handleNavigationAttempt } = useUnsavedChanges();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const handleLinkClick = (href: string) => {
        setIsMobileOpen(false);
        handleNavigationAttempt(href);
    }

    return (
        <>
            {/* Mobile Trigger */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 bg-white rounded-md shadow-md text-gray-600"
                >
                    {isMobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Backdrop (Mobile) */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 shadow-sm transform transition-[width] duration-300 ease-in-out flex flex-col will-change-[width]",
                isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
                isCollapsed ? "lg:w-16" : "lg:w-64"
            )}>
                {/* Logo & Toggle */}
                <div className={cn(
                    "h-16 flex items-center border-b border-gray-100",
                    isCollapsed ? "justify-center px-0" : "justify-between px-4"
                )}>
                    {!isCollapsed && (
                        <h1 className="text-xl font-extrabold text-blue-600 tracking-tight truncate">
                            OCEANSTAR
                        </h1>
                    )}

                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "hidden lg:flex p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors",
                            isCollapsed && "mx-auto"
                        )}
                        title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                {/* Nav Items */}
                <nav className={cn(
                    "flex-1 space-y-1",
                    isCollapsed ? "overflow-visible p-2" : "overflow-y-auto p-4"
                )}>
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleLinkClick(item.href)}
                                className={cn(
                                    "w-full flex items-center rounded-lg text-sm font-medium transition-colors group relative",
                                    isCollapsed ? "justify-center px-0 py-3 gap-0" : "justify-start px-3 py-2.5 gap-3",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />

                                {!isCollapsed && (
                                    <span className="whitespace-nowrap">
                                        {item.name}
                                    </span>
                                )}

                                {/* Tooltip for collapsed mode */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] shadow-md">
                                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                                        {item.name}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className={cn("border-t border-gray-100", isCollapsed ? "p-2" : "p-3")}>
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors group relative",
                            isCollapsed ? "justify-center px-0 py-3 gap-0" : "justify-start px-3 py-2.5 gap-3"
                        )}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />

                        {!isCollapsed && (
                            <span className="whitespace-nowrap">
                                로그아웃
                            </span>
                        )}

                        {isCollapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] shadow-md">
                                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                                로그아웃
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored) {
            setIsCollapsed(stored === "true");
        }

        // Check remember-device expiry
        const remembered = localStorage.getItem("remember-device");
        if (remembered) {
            const expiry = parseInt(remembered, 10);
            if (Date.now() >= expiry) {
                // Expired — sign out
                localStorage.removeItem("remember-device");
                supabase.auth.signOut().then(() => {
                    router.push("/login");
                });
            }
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    // Eliminate hydration mismatch by not rendering collapsed state until mounted
    if (!isMounted) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <UnsavedChangesProvider>
                <AdminSidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-auto flex flex-col min-w-0">
                    <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </UnsavedChangesProvider>
        </div>
    );
}
