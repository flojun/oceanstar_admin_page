import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { RenderEditCellProps } from "react-data-grid";

export default function StatusEditor<R, SR>({ row, column, onRowChange, onClose }: RenderEditCellProps<R, SR>) {
    const initialValue = (row as any)[column.key] || "예약확정";
    const [rect, setRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Focus the menu container after it mounts in the portal
    useEffect(() => {
        if (rect && menuRef.current) {
            menuRef.current.focus();
        }
    }, [rect]);

    const handleSelect = (newValue: string) => {
        onRowChange({ ...row, [column.key]: newValue }, true);
        onClose(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            // If just tabbing through, we might want to save current/initial value? 
            // Or just close? For status, usually we just close if no selection made.
            // But if they hit Enter, they might expect to select the first item? 
            // For now, let's just Close(true) to allow navigation flow.
            // If we want to support arrow keys later, we can add that.
            onClose(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose(false);
        }
    };

    if (!rect) return <div ref={containerRef} className="h-full w-full" />;

    return (
        <div ref={containerRef} className="h-full w-full bg-white relative">
            {createPortal(
                <div
                    ref={menuRef}
                    tabIndex={0} // Make focusable
                    className="fixed z-[9999] bg-white border border-gray-300 shadow-xl rounded-md overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100 outline-none"
                    style={{
                        top: rect.bottom,
                        left: rect.left,
                        minWidth: Math.max(rect.width, 160),
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent RDG from handling click
                    onKeyDown={handleKeyDown}
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
                </div>,
                document.body
            )}
        </div>
    );
}
