import React from 'react';
import { RenderEditCellProps } from 'react-data-grid';

interface SelectEditorProps<TRow, TSummary> extends RenderEditCellProps<TRow, TSummary> {
    options: readonly string[];
}

export default function SelectEditor<TRow, TSummary>({
    row,
    column,
    onRowChange,
    onClose,
    options
}: SelectEditorProps<TRow, TSummary>) {
    return (
        <select
            className="w-full h-full p-2 border-none outline-none bg-white focus:ring-2 focus:ring-blue-500"
            autoFocus
            value={(row[column.key as keyof TRow] as string) || ""}
            onChange={(e) => {
                onRowChange({ ...row, [column.key]: e.target.value });
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onClose(true);
                }
            }}
            onBlur={() => onClose(true)}
        >
            <option value="">(선택)</option>
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}
