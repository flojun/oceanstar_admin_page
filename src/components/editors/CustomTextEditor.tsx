import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { RenderEditCellProps } from "react-data-grid";
import { smartParseRow } from "@/lib/smartParser";

interface CustomTextEditorProps {
    row: any;
    column: any;
    onRowChange: (row: any, commit: boolean) => void;
    onClose?: (commit: boolean) => void;
    isAlwaysOn?: boolean;
    isSelected?: boolean;
    onNavigate?: (action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'TAB' | 'ENTER' | 'SHIFT_TAB') => void;
    className?: string;
}

/**
 * Custom Text Editor (Supports 'Edit Mode', 'Always-On/View Mode', and 'Always-Edit Mode')
 * 
 * Features:
 * 1. Always-On Mode: Rendered directly in renderCell. 
 *    - Zero Latency.
 *    - Perfect IME.
 * 2. Always-Edit Mode (isSelected=true):
 *    - Auto-focuses when selected.
 *    - Proxies navigation keys to Grid.
 */
export default function CustomTextEditor({
    row,
    column,
    onRowChange,
    onClose,
    isAlwaysOn = false,
    isSelected = false,
    onNavigate,
    className
}: CustomTextEditorProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState((row as any)[column.key] ?? "");

    // Sync value if row changes externally (important for Always-On)
    useLayoutEffect(() => {
        setValue((row as any)[column.key] ?? "");
    }, [row, column.key]);

    // Auto-Focus when selected (Always-Edit Mode)
    useEffect(() => {
        if (!isAlwaysOn || !inputRef.current) return;

        // Force focus if we are selected, EITHER via prop OR via DOM state.
        // The DOM state check (aria-selected) bypasses React render lag during rapid navigation.
        const enforceFocus = () => {
            const cell = inputRef.current?.closest('.rdg-cell');
            const isDomSelected = cell?.getAttribute('aria-selected') === 'true';

            if ((isSelected || isDomSelected) && document.activeElement !== inputRef.current) {
                inputRef.current?.focus({ preventScroll: true });
                // Ensure visibility on focus
                inputRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
            }
        };

        // Check immediately
        enforceFocus();

        // Check again on next frame (for race conditions)
        const frameId = requestAnimationFrame(enforceFocus);

        // Also listen for interactions/focusin on the cell to re-enforce
        // This handles cases where Grid steals focus later
        const cell = inputRef.current.closest('.rdg-cell');
        if (cell) {
            const onFocusIn = () => requestAnimationFrame(enforceFocus);
            cell.addEventListener('focusin', onFocusIn);
            return () => {
                cancelAnimationFrame(frameId);
                cell.removeEventListener('focusin', onFocusIn);
            };
        }

        return () => cancelAnimationFrame(frameId);
    }, [isAlwaysOn, isSelected]);


    // Save Handlers
    const save = (newValue: string) => {
        if (newValue === (row as any)[column.key]) return; // No change

        const tempRow = { ...row, [column.key]: newValue };
        const parsedRow = smartParseRow(tempRow);
        onRowChange(parsedRow, true);
    };

    const handleBlur = () => {
        if (isAlwaysOn && inputRef.current) {
            save(inputRef.current.value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) {
            e.stopPropagation(); // Essential for IME
            return;
        }

        // Navigation Proxy for Always-On Editor
        if (isAlwaysOn && onNavigate) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                onNavigate('UP');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onNavigate('DOWN');
            } else if (e.key === 'ArrowLeft') {
                if (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
                    e.preventDefault();
                    onNavigate('LEFT');
                }
                // Else let cursor move inside input
            } else if (e.key === 'ArrowRight') {
                if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
                    e.preventDefault();
                    onNavigate('RIGHT');
                }
                // Else let cursor move
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // Explicitly blur to prevent input from hoarding focus
                e.currentTarget.blur();
                onNavigate(e.shiftKey ? 'SHIFT_TAB' : 'TAB');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                save(e.currentTarget.value);
                e.currentTarget.blur();
                onNavigate('ENTER');
            }
            // Stop propagation to prevent Grid from seizing control doubly?
            e.stopPropagation();
            return;
        }

        // Standard Edit Mode Fallback
        if (e.key === 'Enter' && !isAlwaysOn) {
            // ...
        }

        if (e.key === 'Escape') {
            if (!isAlwaysOn && onClose) {
                onClose(false);
            } else {
                // Revert value?
                setValue((row as any)[column.key] ?? "");
                e.currentTarget.blur();
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    // Auto-save on unmount (Only for Edit Mode)
    useLayoutEffect(() => {
        if (isAlwaysOn) return; // Always-On persists, so relies on Blur.

        return () => {
            if (inputRef.current) {
                // Capture value to avoid stale closure issues if needed, strictly speaking ref.current is mutable
                const currentValue = inputRef.current.value;
                // Use microtask to avoid 'flushSync' error but ensure execution before next paint/data loss check
                Promise.resolve().then(() => {
                    save(currentValue);
                });
            }
        };
    }, [isAlwaysOn]);

    const [isFocused, setIsFocused] = useState(false);

    return (
        <div
            // Use CSS Grid to stack the Sizer Span and the Input
            className={`grid items-center h-full bg-white relative ${className || ''}`}
            style={{
                // Auto-expand logic:
                // If Focused: Fit content (grow with text).
                // If Blurred: lock to 100% of cell.
                width: isFocused ? 'fit-content' : '100%',
                minWidth: '100%', // Never shrink smaller than the cell

                // Keep the z-index/overflow logic from previous step
                zIndex: isFocused ? 100 : 'auto',
                // Box shadow for polish when expanded
                boxShadow: isFocused ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
            }}
            onFocus={(e) => {
                setIsFocused(true);
                if (e.target !== inputRef.current && inputRef.current) {
                    inputRef.current.focus({ preventScroll: true });
                }

                const cell = inputRef.current?.closest('.rdg-cell') as HTMLElement;
                if (cell) {
                    cell.style.overflow = 'visible';
                    cell.style.zIndex = '100';
                }
            }}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsFocused(false);
                    const cell = inputRef.current?.closest('.rdg-cell') as HTMLElement;
                    if (cell) {
                        cell.style.overflow = '';
                        cell.style.zIndex = '';
                    }
                }
            }}
            onClick={() => {
                if (isAlwaysOn && inputRef.current) {
                    inputRef.current.focus({ preventScroll: true });
                }
            }}
        >
            {/* Sizer Span: Invisible but dictates width */}
            <span
                className="col-start-1 row-start-1 px-2 whitespace-pre invisible overflow-hidden"
                style={{
                    font: 'inherit', // Important: Match input font metrics
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center', // Vertical align match
                    visibility: 'hidden'
                }}
                aria-hidden="true"
            >
                {value || ' '}
            </span>

            {/* Actual Input: Overlays the span */}
            <input
                ref={inputRef}
                value={value}
                onChange={handleChange}
                className={`col-start-1 row-start-1 w-full h-full px-2 outline-none text-gray-900 select-text transition-colors duration-75
                    ${isAlwaysOn
                        ? "border-2 border-transparent focus:border-blue-500 hover:border-gray-300"
                        : "border-2 border-blue-500"
                    }`}
                style={{
                    // Background needed to cover span and underlying cell content
                    backgroundColor: 'white',
                }}
                autoFocus={!isAlwaysOn}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                onFocus={(e) => {
                    if (!isAlwaysOn) e.target.select();
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClick={(e) => {
                    // Start editing / selecting
                    // Propagate? If we propagate, grid selects the cell.
                    // But if we stop, we might need to manually trigger selection via callback?
                    // We need isSelected to become true.
                    // If we let it bubble, Grid sets selectedCell.
                    // But Grid might try to enter "Edit Mode".
                    // Since renderEditCell is removed for this column, Grid won't enter Edit Mode.
                    // So bubbling is safe!
                }}
                onDoubleClick={(e) => e.stopPropagation()}
                tabIndex={isAlwaysOn ? -1 : undefined} // Manage tab manually
            />
        </div>
    );
}
