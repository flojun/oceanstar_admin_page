import React, { useState, useRef, useEffect } from 'react';
import { RenderEditCellProps } from 'react-data-grid';

interface ComboSelectEditorProps<TRow, TSummary> extends RenderEditCellProps<TRow, TSummary> {
    options: readonly string[];
    customInputLabel?: string; // Label for the "직접입력" option
}

/**
 * ComboSelectEditor: A hybrid editor that combines dropdown selection with free-text input.
 * 
 * - Shows a dropdown with predefined options
 * - Has a "직접입력" option that switches to a text input field
 * - If the current value is not in the options list, shows the text input mode
 */
export default function ComboSelectEditor<TRow, TSummary>({
    row,
    column,
    onRowChange,
    onClose,
    options,
    customInputLabel = "✏️ 직접입력"
}: ComboSelectEditorProps<TRow, TSummary>) {
    const currentValue = (row[column.key as keyof TRow] as string) || "";
    const isCustomValue = currentValue !== "" && !options.includes(currentValue);
    
    const [isCustomMode, setIsCustomMode] = useState(isCustomValue);
    const [customText, setCustomText] = useState(isCustomValue ? currentValue : "");
    const inputRef = useRef<HTMLInputElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    // Auto-focus the text input when switching to custom mode
    useEffect(() => {
        if (isCustomMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCustomMode]);

    // Auto-focus select on mount if not in custom mode
    useEffect(() => {
        if (!isCustomMode && selectRef.current) {
            selectRef.current.focus();
        }
    }, []);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === "__CUSTOM__") {
            setIsCustomMode(true);
            setCustomText("");
            // Don't update row yet - wait for text input
        } else {
            onRowChange({ ...row, [column.key]: val });
        }
    };

    const handleCustomSubmit = () => {
        const trimmed = customText.trim();
        onRowChange({ ...row, [column.key]: trimmed });
        onClose(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (isCustomMode) {
                handleCustomSubmit();
            } else {
                onClose(true);
            }
        } else if (e.key === 'Escape') {
            if (isCustomMode) {
                // Go back to select mode
                setIsCustomMode(false);
                setCustomText("");
                // Restore original select value
                setTimeout(() => selectRef.current?.focus(), 0);
            } else {
                onClose(false);
            }
        }
    };

    if (isCustomMode) {
        return (
            <div className="flex items-center w-full h-full gap-1 px-1 bg-white">
                <input
                    ref={inputRef}
                    className="flex-1 h-full min-w-0 px-1 text-sm border-none outline-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleCustomSubmit}
                    placeholder="픽업장소 입력"
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="shrink-0 text-xs text-gray-400 hover:text-gray-600 px-1"
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur on input
                        setIsCustomMode(false);
                        setCustomText("");
                        setTimeout(() => selectRef.current?.focus(), 0);
                    }}
                    title="목록으로 돌아가기"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <select
            ref={selectRef}
            className="w-full h-full p-2 border-none outline-none bg-white focus:ring-2 focus:ring-blue-500 text-sm"
            value={options.includes(currentValue) ? currentValue : ""}
            onChange={handleSelectChange}
            onKeyDown={handleKeyDown}
            onBlur={() => onClose(true)}
        >
            <option value="">(선택)</option>
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
            <option value="__CUSTOM__">{customInputLabel}</option>
        </select>
    );
}
