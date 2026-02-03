import React, { useState, useRef, useEffect } from "react";
import { RenderEditCellProps } from "react-data-grid";
import { smartParseRow } from "@/lib/smartParser";

/**
 * Custom Text Editor for React Data Grid
 * Shows existing value and allows editing.
 */
export default function CustomTextEditor<R, SR>({ row, column, onRowChange, onClose }: RenderEditCellProps<R, SR>) {
    // Initialize with existing cell value
    const initialValue = (row as any)[column.key] ?? "";
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Force focus on mount and select all text for easy replacement
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select(); // Select all text for easy editing
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const save = () => {
        // Construct partial row with new value (even if empty)
        const tempRow = { ...row, [column.key]: value };

        // Apply smart parsing
        const parsedRow = smartParseRow(tempRow);

        // Commit change to grid
        onRowChange(parsedRow, true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            save();
            onClose(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose(false); // Cancel without saving
        }
    };

    const handleBlur = () => {
        save();
    };

    return (
        <div className="flex items-center h-full w-full bg-white">
            <input
                ref={inputRef}
                className="w-full h-full px-2 outline-none border-2 border-blue-500 text-gray-900"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                // Prevent click from propagating to prevent row selection
                onClick={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
            />
        </div>
    );
}
