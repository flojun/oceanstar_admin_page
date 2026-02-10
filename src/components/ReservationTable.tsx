"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, Trash2, Settings, Copy } from "lucide-react";
import { Reservation } from "@/types/reservation";
import { cn } from "@/lib/utils";
import { formatDateDisplay } from "@/lib/timeUtils";

interface ReservationTableProps {
    reservations: Reservation[];
    onEdit: (reservation: Reservation) => void;
    onDelete: (id: string) => void;
    onReconfirmToggle?: (id: string, currentVal: boolean) => void;
    loading: boolean;
    isSimpleView?: boolean;
    totalCount?: number;
}

export function ReservationTable({
    reservations = [],
    onEdit,
    onDelete,
    onReconfirmToggle,
    loading,
    isSimpleView = false,
    totalCount = 0,
}: ReservationTableProps) {
    const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
    const [lastCheckedIndex, setLastCheckedIndex] = useState<number | null>(null);

    // Calculate base count for numbering (Newest = High No, Oldest = 1)
    // If totalCount is provided, use it. Otherwise use reservations length.
    // Ensure we handle the case where local rows are added (reservations.length > totalCount)
    const effectiveTotalCount = Math.max(totalCount, reservations.length);

    // Toast timer
    useEffect(() => {
        if (toast?.visible) {
            const timer = setTimeout(() => {
                setToast(prev => prev ? { ...prev, visible: false } : null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as Element).closest('.action-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    if (loading) {
        return (
            <div className="w-full animate-pulse space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 w-full rounded bg-gray-200" />
                ))}
            </div>
        );
    }

    // Column definitions - reordered per user request
    // 순서: 리컨펌, 진행상태, 예약경로, 예약자명, 예약일, 인원, 옵션, 픽업장소, 연락처, 기타사항, 접수일
    const columns = [
        { label: "리컨펌", key: "is_reconfirmed", width: "w-10 md:w-16", align: "center" }, // Reduced for mobile
        { label: "진행상태", key: "status", width: "w-24", align: "center" },
        { label: "예약경로", key: "source", width: "w-24 md:w-32", align: "center" }, // Increased for Korean text
        { label: "예약자명", key: "name", width: "w-24", align: "center" },
        { label: "예약일", key: "tour_date", width: "w-28", align: "center" },
        { label: "인원", key: "pax", width: "w-16", align: "center" },
        { label: "옵션", key: "option", width: "w-24 md:w-32", align: "center" }, // Increased for Korean text
        { label: "픽업장소", key: "pickup_location", width: "w-28", align: "left" },
        { label: "연락처", key: "contact", width: "w-36", align: "left" },
        { label: "기타사항", key: "note", width: "w-48", align: "left" },
        { label: "접수일", key: "receipt_date", width: "w-28", align: "left" },
    ];

    const handleContactClick = async (e: React.MouseEvent, res: Reservation) => {
        if (isSimpleView) {
            // Only trigger copy if the row is ALREADY selected
            if (selectedRowId === res.id) {
                e.stopPropagation(); // Avoid triggering row toggle

                const textToCopy = res.contact || "";
                if (!textToCopy) return;

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    setToast({ message: "복사 완료!", visible: true });
                } catch (err) {
                    console.error("Copy failed", err);
                    setToast({ message: "복사 실패", visible: true });
                }
            }
        }
    };

    return (
        <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow min-h-[300px]">
            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full min-w-max text-sm relative">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            {/* No. Column: Hide in Simple View (Desktop request) */}
                            {!isSimpleView && <th className="px-4 py-3 font-medium text-center hidden md:table-cell">No.</th>}
                            {/* Mobile: Manage column - Hide in Simple View */}
                            {!isSimpleView && <th className="px-2 py-3 font-medium text-center w-10 md:w-16">관리</th>}
                            {columns.map((col) => {
                                // Simple View: Hide specific columns
                                if (isSimpleView) {
                                    if (['is_reconfirmed', 'status', 'receipt_date', 'tour_date'].includes(col.key)) return null;
                                    // Source: Handle separately below (Show on Desktop only)
                                }

                                // Mobile visibility logic
                                if (col.key === 'tour_date' || col.key === 'status') {
                                    return (
                                        <th key={col.key} className={cn("px-4 py-3 font-medium", col.width, `text-${col.align}`, "hidden md:table-cell")}>
                                            {col.label}
                                        </th>
                                    );
                                }
                                if (col.key === 'source') {
                                    // Simple View: Show Source (All screens) - Minimal Width
                                    if (isSimpleView) {
                                        return (
                                            <th key={col.key} className={cn("px-1 py-3 font-medium w-8 text-center text-xs bg-gray-50")}>
                                                경로
                                            </th>
                                        );
                                    }
                                    // Normal View
                                    return (
                                        <th key={col.key} className={cn("px-4 py-3 font-medium", col.width, `text-${col.align}`)}>
                                            <span className="md:hidden">경로</span>
                                            <span className="hidden md:inline">{col.label}</span>
                                        </th>
                                    );
                                }
                                if (col.key === 'receipt_date') {
                                    {/* Insert Status header before Receipt Date on mobile only - BUT hide if Simple View */ }
                                    if (!isSimpleView) {
                                        return (
                                            <React.Fragment key={col.key}>
                                                <th className="px-4 py-3 font-medium w-24 text-center md:hidden">진행상태</th>
                                                <th className={cn("px-4 py-3 font-medium", col.width, `text-${col.align}`)}>
                                                    {col.label}
                                                </th>
                                            </React.Fragment>
                                        );
                                    } else {
                                        // Specific case for SimpleView where we might still want Receipt Date?
                                        // The user said hide "Receipt Date". So this block might not even be reached if key is excluded above.
                                        // But if logic continues:
                                        return null;
                                    }
                                }
                                return (
                                    <th key={col.key} className={cn("px-4 py-3 font-medium", col.width, `text-${col.align}`)}>
                                        {col.label}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reservations.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                                    데이터가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            reservations.map((res, index) => (
                                <tr
                                    key={res.id}
                                    onClick={() => setSelectedRowId(selectedRowId === res.id ? null : res.id)}
                                    className={cn(
                                        "transition-colors cursor-pointer",
                                        selectedRowId === res.id ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-50"
                                    )}
                                >
                                    {!isSimpleView && (
                                        <td className="px-4 py-3 text-xs text-gray-400 text-center hidden md:table-cell">
                                            {effectiveTotalCount - index}
                                        </td>
                                    )}

                                    {!isSimpleView && (
                                        <td className="px-2 py-3 text-center action-menu-container relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === res.id ? null : res.id);
                                                }}
                                                className={cn(
                                                    "p-1.5 rounded-full transition-colors",
                                                    openMenuId === res.id ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                )}
                                            >
                                                <Settings className="w-5 h-5" />
                                            </button>

                                            {openMenuId === res.id && (
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-xl z-[9999] overflow-hidden flex flex-col">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(res);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 text-left"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                                        수정
                                                    </button>
                                                    <div className="h-px bg-gray-100" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(res.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        삭제
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    {!isSimpleView && (
                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={res.is_reconfirmed || false}
                                                onChange={(e) => {
                                                    // @ts-ignore - Triggered by onClick in some frameworks, but here native checkbox
                                                }}
                                                // Using onClick to capture shiftKey
                                                onClick={(e) => {
                                                    e.stopPropagation();

                                                    const currentChecked = res.is_reconfirmed || false;
                                                    const targetChecked = !currentChecked;

                                                    // Handle Shift+Click Range
                                                    if ((e as any).shiftKey && lastCheckedIndex !== null && onReconfirmToggle) {
                                                        const start = Math.min(lastCheckedIndex, index);
                                                        const end = Math.max(lastCheckedIndex, index);

                                                        // Toggle all in range to match TARGET state of this click
                                                        // Note: This calls the prop multiple times. Parent needs to handle it.
                                                        for (let i = start; i <= end; i++) {
                                                            const row = reservations[i];
                                                            // Only toggle if it doesn't match target
                                                            if ((row.is_reconfirmed || false) !== targetChecked) {
                                                                onReconfirmToggle(row.id, row.is_reconfirmed || false);
                                                            }
                                                        }
                                                    } else {
                                                        // Normal Click
                                                        if (onReconfirmToggle) {
                                                            onReconfirmToggle(res.id, currentChecked);
                                                        }
                                                    }

                                                    setLastCheckedIndex(index);
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                    )}

                                    {!isSimpleView && (
                                        <td className="px-4 py-3 text-center hidden md:table-cell">
                                            <span
                                                className={cn(
                                                    "inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5",
                                                    res.status === "예약확정"
                                                        ? "bg-green-100 text-green-800"
                                                        : res.status === "취소"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                                )}
                                            >
                                                {res.status}
                                            </span>
                                        </td>
                                    )}

                                    {isSimpleView ? (
                                        // Simple View: Show on all screens
                                        <td className={cn("px-1 text-gray-900 text-center text-xs", "py-1")}>
                                            {res.source}
                                        </td>
                                    ) : (
                                        // Normal View
                                        <td className={cn("px-2 text-gray-900 text-center", "py-3")}>{res.source}</td>
                                    )}
                                    <td className={cn("px-2 text-gray-900 font-bold text-center", isSimpleView ? "py-1" : "py-3")}>{res.name}</td>
                                    {!isSimpleView && <td className="px-2 py-3 text-gray-600 text-center hidden md:table-cell">{formatDateDisplay(res.tour_date)}</td>}
                                    <td className={cn("px-2 text-gray-600 font-bold text-center", isSimpleView ? "py-1" : "py-3")}>{res.pax}</td>
                                    <td className={cn("px-2 text-gray-600 font-mono text-xs text-center", isSimpleView ? "py-1" : "py-3")}>{res.option}</td>
                                    <td className={cn("px-4 text-gray-600 truncate max-w-[200px]", isSimpleView ? "py-1" : "py-3")} title={res.pickup_location}>
                                        {res.pickup_location}
                                    </td>
                                    <td
                                        className={cn("px-4 text-gray-600", isSimpleView ? "py-1 cursor-pointer active:bg-blue-200" : "py-3")}
                                        onClick={(e) => handleContactClick(e, res)}
                                    >
                                        {res.contact}
                                    </td>
                                    <td className={cn("px-4 text-gray-500 truncate max-w-[200px]", isSimpleView ? "py-1" : "py-3")} title={res.note}>
                                        {res.note}
                                    </td>
                                    {/* Mobile Only Status Column */}
                                    {!isSimpleView && (
                                        <td className="px-4 py-3 text-center md:hidden">
                                            <span
                                                className={cn(
                                                    "inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5",
                                                    res.status === "예약확정"
                                                        ? "bg-green-100 text-green-800"
                                                        : res.status === "취소"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                                )}
                                            >
                                                {res.status}
                                            </span>
                                        </td>
                                    )}
                                    {!isSimpleView && <td className="px-4 py-3 text-gray-900 font-medium">{formatDateDisplay(res.receipt_date)}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="h-24"></div> {/* Bottom spacer for dropdown */}
            </div>

            {/* Toast Notification */}
            {toast && toast.visible && createPortal(
                <div className="fixed bottom-6 right-6 z-[99999] bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Copy className="w-4 h-4" />
                    {toast.message}
                </div>,
                document.body
            )}
        </div>
    );
}
