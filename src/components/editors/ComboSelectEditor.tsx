import React, { useState, useRef, useEffect } from 'react';
import { RenderEditCellProps } from 'react-data-grid';

interface ComboSelectEditorProps<TRow, TSummary> extends RenderEditCellProps<TRow, TSummary> {
    options: readonly string[];
    customInputLabel?: string;
}

/**
 * ComboSelectEditor: 드롭다운 선택 + 직접입력 콤보박스 에디터.
 * 
 * - 미리 정의된 옵션 목록에서 선택 가능
 * - "✏️ 직접입력" 선택 시 텍스트 입력 모드로 전환
 * - 기존에 직접 입력된 값이 있는 셀은 자동으로 텍스트 입력 모드로 표시
 * 
 * 커밋 전략:
 * - onBlur: 값만 업데이트(커밋 X) → 에디터가 즉시 닫히지 않음
 * - Enter: 값 업데이트 + 커밋 (에디터 닫힘)
 * - 외부 클릭: editorOptions.commitOnOutsideClick=true가 자동 커밋 처리
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

    // Auto-focus: 커스텀 모드 전환 시 input에 포커스
    useEffect(() => {
        if (isCustomMode) {
            // requestAnimationFrame으로 지연시켜 react-data-grid의 포커스 관리와 충돌 방지
            const frameId = requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
            return () => cancelAnimationFrame(frameId);
        }
    }, [isCustomMode]);

    // Auto-focus: select 모드 마운트 시
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
        } else {
            // 선택 값은 바로 row에 반영 (커밋은 안 함 - blur/외부클릭이 커밋)
            onRowChange({ ...row, [column.key]: val } as TRow);
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setCustomText(newValue);
        // 매 타이핑마다 row를 동기화 → commitOnOutsideClick 시 최신 값 커밋
        onRowChange({ ...row, [column.key]: newValue } as TRow);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (isCustomMode) {
                // Enter: 값 업데이트 + 커밋 (에디터 닫힘)
                const trimmed = customText.trim();
                onRowChange({ ...row, [column.key]: trimmed } as TRow, true);
            } else {
                onClose(true);
            }
        } else if (e.key === 'Escape') {
            if (isCustomMode) {
                setIsCustomMode(false);
                setCustomText("");
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
                    onChange={handleCustomChange}
                    onKeyDown={handleKeyDown}
                    placeholder="픽업장소 입력"
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="shrink-0 text-xs text-gray-400 hover:text-gray-600 px-1"
                    onMouseDown={(e) => {
                        e.preventDefault(); // blur 방지
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
