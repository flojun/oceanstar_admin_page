"use client";

import Navbar from "@/components/Navbar";
import { UnsavedChangesProvider } from "@/components/providers/UnsavedChangesProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen flex flex-col bg-blue-50 overflow-hidden">
            <UnsavedChangesProvider>
                {/* Top Navigation Bar */}
                <Navbar />

                {/* Main Content - Takes remaining height */}
                <main className="flex-1 w-full mx-auto max-w-7xl p-4 md:p-8 overflow-hidden flex flex-col">
                    {children}
                </main>
            </UnsavedChangesProvider>
        </div>
    );
}
