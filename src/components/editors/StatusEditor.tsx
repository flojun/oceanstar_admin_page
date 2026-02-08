import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { RenderEditCellProps } from "react-data-grid";

export default function StatusEditor<R, SR>({ row, column, onRowChange, onClose }: RenderEditCellProps<R, SR>) {
    const initialValue = (row as any)[column.key] || "예약확정";
    const [rect, setRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Options configuration
    const options = [
        { value: "예약확정", label: "예약확정 (Confirmed)", color: "text-green-600" },
        { value: "예약대기", label: "예약대기 (Waiting)", color: "text-yellow-600" },
        { value: "취소요청", label: "취소요청 (Request Cncl)", color: "text-orange-600" },
        { value: "취소", label: "취소 (Cancel)", color: "text-red-600" },
    ];

    // Measure cell position on mount
    useLayoutEffect(() => {
        if (containerRef.current) {
            const parentCell = containerRef.current.closest('.rdg-cell');
            if (parentCell) {
                setRect(parentCell.getBoundingClientRect());
            } else {
                // Fallback if generic parent
                setRect(containerRef.current.getBoundingClientRect());
            }
        }
    }, []);

    const handleSelect = (newValue: string) => {
        onRowChange({ ...row, [column.key]: newValue }, true);
        onClose(true);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // If click is not inside the portal menu... logic is tricky with Portal.
            // But since creating the portal here effectively "captures" the edit mode.
            // If user clicks *anywhere else*, RDG handles blur usually? 
            // BUT, our menu is in a Portal, so clicks there might register as "outside" to RDG.
            // We need to stop propagation inside the menu.
        };
        // Actually, preventing RDG auto-close might be needed if focus moves to portal.
        // But for a simple list, we can just let it render. 
        // RDG usually closes if focus leaves the editor container.
    }, []);

    if (!rect) return <div ref={containerRef} className="h-full w-full" />;

    return (
        <div ref={containerRef} className="h-full w-full bg-white relative">
            {createPortal(
                <div
                    className="fixed z-[9999] bg-white border border-gray-300 shadow-xl rounded-md overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: rect.bottom,
                        left: rect.left,
                        minWidth: Math.max(rect.width, 160),
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent RDG from handling click
                >
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-2 ${opt.value === initialValue ? 'bg-blue-50 font-bold' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            <span className={`w-2 h-2 rounded-full ${opt.value === '예약확정' ? 'bg-green-500' : opt.value === '예약대기' ? 'bg-yellow-500' : opt.value === '취소요청' ? 'bg-orange-500' : 'bg-red-500'}`} />
                            <span className={opt.color}>{opt.label}</span>
                        </div>
                    ))}
                    {/* Backdrop to handle clicks outside more gracefully ? No, RDG handles it */}
                </div>,
                document.body
            )}
            {/* 
               We render a transparent overlay or keep the current cell 
               to maintain "Focus" so RDG doesn't close immediately?
               A simple div is enough usually.
            */}
        </div>
    );
}
