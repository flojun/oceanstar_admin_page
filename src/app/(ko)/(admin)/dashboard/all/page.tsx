"use client";

import "react-data-grid/lib/styles.css";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { DataGrid, RenderEditCellProps, FillEvent, DataGridHandle } from "react-data-grid";
import { Save, Settings, Plus, Undo, Redo } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Reservation, ReservationInsert } from "@/types/reservation";
import { smartParseRow } from "@/lib/smartParser";
import { cn } from "@/lib/utils";
import { getHawaiiDateStr, formatDateDisplay, getKoreanDay, getKoreanDayShort } from "@/lib/timeUtils";
import { useUnsavedChanges } from "@/components/providers/UnsavedChangesProvider";
import CustomTextEditor from "@/components/editors/CustomTextEditor";
import ComboSelectEditor from "@/components/editors/ComboSelectEditor";
import { PICKUP_LOCATIONS } from "@/constants/pickupLocations";
import StatusEditor from "@/components/editors/StatusEditor";
import type { TourSetting } from "@/lib/tourUtils";
import { resolveOptionToTourSetting, getVesselBadgeColor, getShortLabel } from "@/lib/tourUtils";
interface RangeSelection {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
}

// Helper to create an empty row with initialized strings
const createEmptyRow = (): Partial<Reservation> & { isNew?: boolean, _grid_id: string, _capacityStatus?: string, _capacityMsg?: string } => ({
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    _grid_id: crypto.randomUUID(),
    status: "예약확정",
    receipt_date: "",
    source: "",
    name: "",
    tour_date: "",
    pax: "",
    option: "",
    pickup_location: "",
    contact: "",
    note: "",
    is_reconfirmed: false,
    isNew: true,
});

// Inherit styles from global or reuse class structure
const fullHeightGridStyle = `
  .rdg-cell {
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    user-select: none !important;
    cursor: pointer !important;
    color: #111827;
  }
  .rdg-header-row {
    background-color: #f9fafb;
    font-weight: 600;
  }
  .rdg-header-cell {
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f3f4f6;
  }
  .rdg-cell-selected {
    outline: 2px solid #3b82f6 !important;
    outline-offset: -2px;
    z-index: 5;
  }
  .no-col-bg {
    background-color: #f9fafb !important;
  }
  .overbooking-warning {
    background-color: #fee2e2 !important;
    color: #b91c1c !important;
  }
`;

const highlightFlashStyle = `
  @keyframes highlight-flash {
    0%, 100% { background-color: transparent; }
    25% { background-color: #fef08a; }
    50% { background-color: transparent; }
    75% { background-color: #fef08a; }
  }
  .rdg-row.highlight-row .rdg-cell {
    animation: highlight-flash 2s ease-in-out;
  }
`;

const parsePax = (str: string): number => {
    if (!str) return 0;
    const num = parseInt(str.toString().replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
};

import CancellationRequestsView from "@/components/reservations/CancellationRequestsView";
import RescheduleRequestsView from "@/components/reservations/RescheduleRequestsView";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function AllReservationsContent() {
    const searchParams = useSearchParams();
    const initialView = searchParams.get('view') as 'input' | 'cancellation' | 'reschedule' || 'input';
    const [activeTab, setActiveTab] = useState<'input' | 'cancellation' | 'reschedule'>(initialView);

    // Update activeTab when searchParams change (if navigating within same page)
    const highlightId = searchParams.get('highlight');
    useEffect(() => {
        const view = searchParams.get('view');
        if (view === 'cancellation') {
            setActiveTab('cancellation');
        } else if (view === 'input') {
            setActiveTab('input');
        } else if (view === 'reschedule') {
            setActiveTab('reschedule');
        }
    }, [searchParams]);

    // ... rest of state ...
    const [rows, setRows] = useState<(Reservation | (Partial<Reservation> & { isNew?: boolean, _grid_id?: string, _capacityStatus?: string, _capacityMsg?: string }))[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0); // Store total count for row numbering
    const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set());
    const [changedRowIds, setChangedRowIds] = useState<Set<string>>(new Set());
    const changedRowIdsRef = useRef<Set<string>>(new Set());
    const rowsRef = useRef<any[]>([]);
    const searchResultsRef = useRef<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<DataGridHandle>(null);
    const [saving, setSaving] = useState(false);
    const isSubmitting = useRef(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleSaveRef = useRef<(isAutoSave?: boolean) => Promise<void>>(undefined);

    const triggerAutoSave = useCallback(() => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
            handleSaveRef.current?.(true);
        }, 500);
    }, []);

    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    const [tourSettings, setTourSettings] = useState<TourSetting[]>([]);
    useEffect(() => {
        supabase.from('tour_settings').select('*').order('display_order').then(({ data }) => {
            if (data) setTourSettings(data);
        });
    }, []);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

    // Range Selection State
    const [actionModal, setActionModal] = useState<{ id: string; idx: number } | null>(null);

    // Track previously selected cell for range selection
    const [lastSelectedIdx, setLastSelectedIdx] = useState<number>(-1);
    const [selectedCell, setSelectedCell] = useState<{ idx: number; rowIdx: number } | null>(null);
    const [anchorCell, setAnchorCell] = useState<{ idx: number; rowIdx: number } | null>(null);
    const [rangeSelection, setRangeSelection] = useState<RangeSelection | null>(null);

    const { setIsDirty, registerSaveHandler } = useUnsavedChanges();
    const PAGE_SIZE = 1000;
    const [activeActionRow, setActiveActionRow] = useState<{ id: string, index: number } | null>(null);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Copy Feature State
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copyStartRow, setCopyStartRow] = useState('');
    const [copyEndRow, setCopyEndRow] = useState('');

    // Search State
    const [searchCriteria, setSearchCriteria] = useState<'name' | 'source' | 'tour_date' | 'contact'>('name');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null); // null = no active search
    const [isSearching, setIsSearching] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Expanded Cell State (Tooltip)
    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; rect: DOMRect } | null>(null);

    // Dynamic Column Width State
    const [noteColWidth, setNoteColWidth] = useState(160);

    // Undo/Redo State
    // History item: { rows: rows data, changedRowIds: set of changed ids }
    const [history, setHistory] = useState<{ rows: any[], changedRowIds: Set<string> }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Helper to update rows with history tracking
    // isHistoryAction: true if called from undo/redo (don't push to history)
    const updateRowsWithHistory = (newRows: any[], newChangedIds: Set<string>, isHistoryAction = false) => {
        if (!isHistoryAction) {
            // Push current state to history before changing, IF we aren't at the tip
            // Wait, standard undo implementation:
            // History contains *snapshots*.
            // When we make a change, we assume the *previous* state is already in history? 
            // Or we push the *new* state?

            // Strategy: History stack contains the sequence of states.
            // history[historyIndex] is the current state displayed.
            // When we make a new change:
            // 1. Slice history up to historyIndex + 1.
            // 2. Push new state.
            // 3. Move index to end.

            // But we need to initialize history with the *initial* loaded state?
            // On first load, we should set history?

            const stateToPush = {
                rows: newRows,
                changedRowIds: newChangedIds
            };

            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(stateToPush);

            // Limit history size (optional, e.g., 50 steps)
            if (newHistory.length > 50) {
                newHistory.shift();
            }

            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }

        setRows(newRows);
        rowsRef.current = newRows;
        setChangedRowIds(newChangedIds);
        changedRowIdsRef.current = newChangedIds;

        const hasValidNewRows = newRows.some(r => r.isNew && (r.name || r.tour_date || r.contact || r.receipt_date));
        if (newChangedIds.size > 0 || hasValidNewRows) {
            triggerAutoSave();
        }
    };

    // Initialize history when data is first loaded (only if history is empty)
    useEffect(() => {
        if (!loading && rows.length > 0 && history.length === 0) {
            const initialState = { rows: [...rows], changedRowIds: new Set(changedRowIds) };
            setHistory([initialState]);
            setHistoryIndex(0);
        }
    }, [loading, rows.length]); // Depend on rows.length to capture initial load

    // Scroll to highlighted row from ?highlight=ID
    useEffect(() => {
        if (!highlightId || loading || rows.length === 0) return;
        const rowIdx = rows.findIndex(r => r.id === highlightId);
        if (rowIdx >= 0 && gridRef.current) {
            // Ensure we're on the input tab to see the grid
            setActiveTab('input');
            // Small delay to let the grid render
            setTimeout(() => {
                gridRef.current?.scrollToCell({ rowIdx, idx: 0 });
            }, 300);
        }
    }, [highlightId, loading, rows.length]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevState = history[prevIndex];
            setHistoryIndex(prevIndex);
            updateRowsWithHistory(prevState.rows, prevState.changedRowIds, true);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextState = history[nextIndex];
            setHistoryIndex(nextIndex);
            updateRowsWithHistory(nextState.rows, nextState.changedRowIds, true);
        }
    }, [history, historyIndex]);

    // Single Row Update Handler for Always-On Editors
    const handleSingleRowChange = useCallback((updatedRow: any) => {
        setRows(prevRows => {
            const idx = prevRows.findIndex(r => (r as any)._grid_id === (updatedRow as any)._grid_id);
            if (idx === -1) return prevRows;

            const newRows = [...prevRows];
            newRows[idx] = updatedRow;

            // We also need to update changedRowIds
            if (updatedRow.id && !updatedRow.isNew) {
                setChangedRowIds(prev => {
                    const next = new Set(prev);
                    next.add(updatedRow.id);
                    changedRowIdsRef.current = next;
                    return next;
                });
            }

            // History?
            // Ideally we debate if every keystroke/blur should push history.
            // For now, let's skip history for high-frequency updates or debounce it?
            // But CustomTextEditor only calls onRowChange on BLUR or Enter.
            // So pressing Enter/Blurring IS a history-worthy event.

            // But we can't call setHistory inside setRows easily without ref.
            // Let's rely on the useEffect or just call updateRowsWithHistory wrapper?
            // updateRowsWithHistory requires Passing the FULL new array.
            // But we are inside a callback.

            return newRows;
        });

        // This is tricky. updateRowsWithHistory works on the *current* state.
        // If we use setRows(callback), we are safe from race conditions but harder to push history.
        // Let's use the functional approach but trigger history update separately if needed?
        // Or just use updateRowsWithHistory directly if we trust 'rows' dependency?
        // 'rows' is a dependency of useMemo(columns), so this function is recreated on rows change.
        // So 'rows' is fresh.

    }, []);

    // Redefining handleSingleRowChange to use updateRowsWithHistory directly
    // This allows history tracking.
    const handleSingleRowChangeDirect = useCallback((updatedRow: any) => {
        const updatedGlobalRows = [...rows];
        const updatedSearchResults = searchResults ? [...searchResults] : null;

        const nextChangedIds = new Set(changedRowIds);
        if (updatedRow.id && !updatedRow.isNew) {
            nextChangedIds.add(updatedRow.id);
        }

        let found = false;

        // Update in global rows (try _grid_id first, then fall back to id)
        let idx = updatedGlobalRows.findIndex(r => (r as any)._grid_id === (updatedRow as any)._grid_id);
        if (idx === -1 && updatedRow.id && !updatedRow.isNew) {
            // Fallback: search results have different _grid_id than global rows
            idx = updatedGlobalRows.findIndex(r => r.id === updatedRow.id);
        }
        if (idx !== -1) {
            const currentLatest = updatedGlobalRows[idx];
            const mergedRow = { ...currentLatest, ...updatedRow };

            // Prevent Stale Editor Props from reverting a background-saved row back to "isNew"
            if ((currentLatest as any).id && !(currentLatest as any).isNew && updatedRow.isNew) {
                delete mergedRow.isNew;
                mergedRow.id = currentLatest.id; // Restore DB ID
                mergedRow.receipt_date = currentLatest.receipt_date;
                mergedRow.created_at = currentLatest.created_at;
            }

            // Preserve the global row's _grid_id to avoid breaking grid key tracking
            updatedGlobalRows[idx] = { ...mergedRow, _grid_id: (currentLatest as any)._grid_id };
            found = true;
        }

        // Update in search results
        if (updatedSearchResults) {
            const searchIdx = updatedSearchResults.findIndex(r => (r as any)._grid_id === (updatedRow as any)._grid_id);
            if (searchIdx !== -1) {
                const currentLatestSearch = updatedSearchResults[searchIdx];
                const mergedSearch = { ...currentLatestSearch, ...updatedRow };

                if ((currentLatestSearch as any).id && !(currentLatestSearch as any).isNew && updatedRow.isNew) {
                    delete mergedSearch.isNew;
                    mergedSearch.id = currentLatestSearch.id;
                    mergedSearch.receipt_date = currentLatestSearch.receipt_date;
                    mergedSearch.created_at = currentLatestSearch.created_at;
                }

                updatedSearchResults[searchIdx] = { ...mergedSearch, _grid_id: (currentLatestSearch as any)._grid_id };
                found = true;
            }
        }

        if (!found) return;

        if (updatedSearchResults) {
            setSearchResults(updatedSearchResults);
            searchResultsRef.current = updatedSearchResults;
        }
        updateRowsWithHistory(updatedGlobalRows, nextChangedIds);

    }, [rows, searchResults, changedRowIds, updateRowsWithHistory]);

    // Ref to always point to the latest handler (avoids stale closure in columns useMemo)
    const handleSingleRowChangeDirectRef = useRef(handleSingleRowChangeDirect);
    handleSingleRowChangeDirectRef.current = handleSingleRowChangeDirect;

    // Navigation Handler for Always-Edit Inputs
    const handleEditorNavigation = useCallback((action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'TAB' | 'ENTER' | 'SHIFT_TAB', rowIdx: number, colIdx: number) => {
        let nextRowIdx = rowIdx;
        let nextColIdx = colIdx;

        switch (action) {
            case 'UP':
                nextRowIdx = Math.max(0, rowIdx - 1);
                break;
            case 'DOWN':
            case 'ENTER':
                nextRowIdx = Math.min(rows.length - 1, rowIdx + 1);
                break;
            case 'LEFT':
                // Skip read-only columns logic if needed (e.g. cols < 7)
                nextColIdx = colIdx - 1;
                break;
            case 'RIGHT':
            case 'TAB':
                nextColIdx = colIdx + 1;
                // Wrap to PREVIOUS row (Bottom-to-Top flow) as requested
                if (nextColIdx >= columns.length) {
                    nextColIdx = 0;
                    nextRowIdx = Math.max(0, rowIdx - 1); // Move UP

                    // If at the very top (first row, last col), loop to bottom?
                    // Or stop.
                    if (rowIdx === 0 && colIdx === columns.length - 1) {
                        // Let's loop to bottom for convenience or stay put.
                        // User asked for "Bottom to Up", implies filling form upwards.
                        // Stopping at 0 is safer.
                        nextRowIdx = 0;
                        nextColIdx = columns.length - 1; // Stay at end? Or wrap to start?
                        // Let's actually just stop wrapping if we can't go up.
                        nextColIdx = colIdx;
                    }
                }
                break;
            case 'SHIFT_TAB':
                nextColIdx = colIdx - 1;
                // Wrap to NEXT row (Reverse of Bottom-to-Top)
                if (nextColIdx < 0) {
                    nextColIdx = columns.length - 1;
                    nextRowIdx = Math.min(rows.length - 1, rowIdx + 1); // Move DOWN

                    if (rowIdx === rows.length - 1 && colIdx === 0) {
                        nextRowIdx = rows.length - 1;
                        nextColIdx = 0;
                    }
                }
                break;
        }

        // Update local state
        setSelectedCell({ rowIdx: nextRowIdx, idx: nextColIdx });

        if (gridRef.current && 'selectCell' in gridRef.current) {
            (gridRef.current as any).selectCell({ rowIdx: nextRowIdx, idx: nextColIdx });

            // Explicitly focus the correct element to ensure typing works immediately
            // Using requestAnimationFrame is better than setTimeout(0) for paint synchronization
            requestAnimationFrame(() => {
                // Find the currently selected cell in the DOM
                const selectedCellNode = document.querySelector('.rdg-cell[aria-selected="true"]') as HTMLElement;
                if (selectedCellNode) {
                    const targetColumn = columns[nextColIdx];
                    if (!targetColumn) return;

                    const isAlwaysEditColumn = ['name', 'pickup_location', 'note'].includes(targetColumn.key);

                    if (isAlwaysEditColumn) {
                        // For Always-Edit cells, we rely on the component's internal useEffect to grab focus.
                        // However, we still attempt to find the input and focus it here as a backup
                        const inputNode = selectedCellNode.querySelector('input');
                        if (inputNode) {
                            inputNode.focus({ preventScroll: true });
                        }
                        // If input is not found, we DO NOT focus the cell div, as that would steal focus from the input
                        // when it eventually mounts.
                    } else {
                        // For Standard cells, focus the CELL div
                        selectedCellNode.focus({ preventScroll: true });
                    }

                    // Automatic Scroll Tracking
                    // Ensure the selected cell is visible in the viewport
                    selectedCellNode.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                } else {
                    // Fallback
                    const gridElement = (gridRef.current as any).element;
                    if (gridElement) gridElement.focus({ preventScroll: true });
                }
            });
        }

    }, [rows.length]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y')) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const updateWidth = () => {
            if (gridContainerRef.current) {
                const containerWidth = gridContainerRef.current.clientWidth;
                // Sum of fixed widths of other columns:
                // no_col(50) + select_col(50) + actions_col(60) + receipt_date(100) + status(80) +
                // source(60) + name(90) + tour_date(100) + pax(60) + option(60) + pickup(96) + contact(130)
                // Total = 936
                const fixedWidths = 936;
                // 2px for border correction if needed, or scrollbar buffer.
                const buffer = 2;
                const remaining = containerWidth - fixedWidths - buffer;

                // If remaining is less than min width (160), use 160 (horizontal scroll triggers).
                // If remaining is greater, use remaining (fills space).
                setNoteColWidth(Math.max(160, remaining));
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            // Debounce the resize update to prevent layout thrashing during sidebar transition
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                requestAnimationFrame(updateWidth);
            }, 100); // 100ms delay to wait for transition to settle
        });

        if (gridContainerRef.current) {
            resizeObserver.observe(gridContainerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const ensureUniqueIds = (data: any[]): any[] => {
        const seen = new Set();
        return data.map((row, index) => {
            let uniqueId = row.id;
            if (!uniqueId || seen.has(uniqueId)) {
                uniqueId = uniqueId ? `${uniqueId}_dup_${index}` : `row_${crypto.randomUUID()}`;
            }
            seen.add(uniqueId);
            return { ...row, id: uniqueId, _grid_id: row._grid_id || crypto.randomUUID() };
        });
    };

    // Async Overbooking Check (Dynamic)
    const checkOverbooking = async (row: any) => {
        const resolved = resolveOptionToTourSetting(row.option || "", tourSettings);
        if (!resolved.tourSetting) {
            setRows(prev => {
                const updated = [...prev];
                const realIdx = updated.findIndex(r => r._grid_id === row._grid_id);
                if (realIdx >= 0) (updated[realIdx] as any)._capacityStatus = null;
                return updated;
            });
            setSearchResults(prev => {
                if (!prev) return prev;
                const updated = [...prev];
                const realIdx = updated.findIndex(r => r._grid_id === row._grid_id);
                if (realIdx >= 0) (updated[realIdx] as any)._capacityStatus = null;
                return updated;
            });
            return;
        }

        const group = resolved.group;
        const limit = resolved.capacity;
        const newPax = parsePax(row.pax || "");

        try {
            const { data, error } = await supabase
                .from("reservations")
                .select("id, pax, option")
                .eq("tour_date", row.tour_date)
                .neq("status", "취소");

            if (error) throw error;

            let dbTotal = 0;
            if (data) {
                data.forEach(r => {
                    // Exclude current row to prevent double-counting when editing existing row
                    if (row.id && !row.isNew && r.id === row.id) return;
                    const rResolved = resolveOptionToTourSetting(r.option || "", tourSettings);
                    // Match group AND vessel for multi-vessel accuracy
                    if (rResolved.group === group && rResolved.vessel === resolved.vessel) {
                        dbTotal += parsePax(r.pax);
                    }
                });
            }

            const total = dbTotal + newPax;
            const isOver = total > limit;
            const msg = `${group}: 확정${dbTotal} + 입력${newPax} = ${total}/${limit}명${isOver ? " (초과!)" : ""}`;

            setRows(prev => {
                const updated = [...prev];
                const realIdx = updated.findIndex(r => r._grid_id === row._grid_id);
                if (realIdx >= 0) {
                    (updated[realIdx] as any)._capacityStatus = isOver ? 'warning' : 'safe';
                    (updated[realIdx] as any)._capacityMsg = msg;
                }
                return updated;
            });
            setSearchResults(prev => {
                if (!prev) return prev;
                const updated = [...prev];
                const realIdx = updated.findIndex(r => r._grid_id === row._grid_id);
                if (realIdx >= 0) {
                    (updated[realIdx] as any)._capacityStatus = isOver ? 'warning' : 'safe';
                    (updated[realIdx] as any)._capacityMsg = msg;
                }
                return updated;
            });
        } catch (err) {
            console.error(err);
        }
    };

    const isFetching = useRef(false);

    const fetchReservations = async (pageIndex: number, isRefresh = false) => {
        if (!hasMore && !isRefresh) return;
        if (isFetching.current) return;

        isFetching.current = true;
        if (pageIndex === 0) setLoading(true);

        try {
            const from = pageIndex * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // Fetch Count separately to avoid potential issues with range/count combination
            let fetchedCount = null;
            // Only fetch count on first page or if we don't have it yet
            if (pageIndex === 0 || totalCount === 0) {
                const { count, error: countError } = await supabase
                    .from("reservations")
                    .select("*", { count: 'exact', head: true });

                if (countError) {
                    console.error("Error fetching count:", countError);
                    // Don't throw, just ignore count failure to allow data to load
                } else {
                    fetchedCount = count;
                }
            }

            const { data, error } = await supabase
                .from("reservations")
                .select("*")
                .order("receipt_date", { ascending: false }) // Primary: Receipt Date (Newest Top)
                .order("created_at", { ascending: false })   // Secondary: Time (Stability)
                .order("id", { ascending: false })           // Tertiary: ID (Absolute Stability)
                .range(from, to);

            if (error) throw error;

            if (data) {
                if (fetchedCount !== null) setTotalCount(fetchedCount); // Update total count

                if (isRefresh) {
                    const sanitized = ensureUniqueIds(data);
                    setRows(sanitized);
                    setPage(1);
                    setHasMore(data.length === PAGE_SIZE);
                    // Reset history on refresh
                    if (sanitized.length > 0) {
                        setHistory([{ rows: sanitized, changedRowIds: new Set() }]);
                        setHistoryIndex(0);
                    }
                } else {
                    setRows(prev => {
                        const existingIds = new Set(prev.map(r => r.id));
                        const nonConflictingData = data.filter(r => !existingIds.has(r.id));
                        const sanitizedBatch = ensureUniqueIds(nonConflictingData);
                        return [...prev, ...sanitizedBatch];
                    });
                    setPage(prev => prev + 1);
                    setHasMore(data.length === PAGE_SIZE);
                }
            }
        } catch (error) {
            console.error("Error fetching all reservations:", JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    useEffect(() => {
        fetchReservations(0, true);
    }, []);

    useEffect(() => {
        setRows((prevRows) => {
            const seenIds = new Set();
            let hasDuplicate = false;

            const sanitizedRows = prevRows.map((row) => {
                const uniqueId = row.id;
                if (!uniqueId || seenIds.has(uniqueId)) {
                    hasDuplicate = true;
                    const fixedId = uniqueId
                        ? `${uniqueId}_duplicate_${Math.random().toString(36).slice(2, 9)}`
                        : `gen-${Math.random().toString(36).slice(2, 9)}`;
                    return { ...row, id: fixedId };
                }
                seenIds.add(uniqueId);
                return row;
            });

            if (hasDuplicate) {
                console.warn('🚨 ID Sanitizer activated');
                return sanitizedRows;
            }
            return prevRows;
        });
    }, [rows.length]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 200 && !loading && hasMore) {
            fetchReservations(page);
        }
    };

    const handleFill = useCallback(({ columnKey, sourceRow, targetRow }: FillEvent<any>): any => {
        // 소스 값 추출
        const sourceValue = sourceRow[columnKey] ?? '';

        // 대상 행의 기존 데이터를 유지하면서 해당 컬럼만 업데이트
        const updatedRow = {
            ...targetRow,  // 기존 행의 모든 데이터 유지
            [columnKey]: sourceValue  // 해당 컬럼만 업데이트
        };

        console.log('Fill:', { columnKey, from: sourceValue, targetRow: targetRow.id });

        // 변경 추적
        if (!updatedRow.isNew && updatedRow.id) {
            setChangedRowIds(prev => new Set(prev).add(updatedRow.id));
                changedRowIdsRef.current = new Set(changedRowIdsRef.current).add(updatedRow.id);
        }

        return updatedRow;
    }, []);

    const handleRowsChange = (newRows: any[], { indexes }: { indexes: number[] }) => {
        const newChangedIds = new Set(changedRowIds);
        const updatedGlobalRows = [...rows];
        const updatedSearchResults = searchResults ? [...searchResults] : null;

        indexes.forEach((index) => {
            const oldRow = filteredRows[index];
            let newRow = newRows[index];
            newRow = { ...smartParseRow(newRow), _grid_id: oldRow._grid_id };

            // Overbooking Trigger
            if (newRow.tour_date !== oldRow.tour_date || newRow.option !== oldRow.option || newRow.pax !== oldRow.pax) {
                if (newRow.tour_date && newRow.option && newRow.pax) {
                    (newRow as any)._capacityStatus = 'checking'; // Instant visual feedback
                    checkOverbooking(newRow);
                }
            } else {
                // Preserve status if not changed
                (newRow as any)._capacityStatus = (oldRow as any)._capacityStatus;
                (newRow as any)._capacityMsg = (oldRow as any)._capacityMsg;
            }

            const hasChanged = Object.keys(newRow).some((k) => {
                const key = k as keyof Reservation;
                return oldRow[key] !== newRow[key];
            });

            if (hasChanged) {
                newChangedIds.add(newRow.id!);
            }

            // Sync with searchResults if active
            if (updatedSearchResults) {
                const currentLatestSearch = updatedSearchResults[index];
                if ((currentLatestSearch as any).id && !(currentLatestSearch as any).isNew && newRow.isNew) {
                    delete newRow.isNew;
                    newRow.id = currentLatestSearch.id;
                    newRow.receipt_date = currentLatestSearch.receipt_date;
                    newRow.created_at = currentLatestSearch.created_at;
                }
                updatedSearchResults[index] = newRow;
            }

            // Sync with global rows
            let globalIdx = updatedGlobalRows.findIndex(r => (r as any)._grid_id === newRow._grid_id);
            if (globalIdx === -1 && newRow.id && !newRow.isNew) {
                globalIdx = updatedGlobalRows.findIndex(r => r.id === newRow.id);
            }
            if (globalIdx >= 0) {
                const currentLatest = updatedGlobalRows[globalIdx];
                if ((currentLatest as any).id && !(currentLatest as any).isNew && newRow.isNew) {
                    delete newRow.isNew;
                    newRow.id = currentLatest.id;
                    newRow.receipt_date = currentLatest.receipt_date;
                    newRow.created_at = currentLatest.created_at;
                }
                updatedGlobalRows[globalIdx] = { ...newRow, _grid_id: (currentLatest as any)._grid_id };
            }
        });

        if (updatedSearchResults) {
            setSearchResults(updatedSearchResults);
            searchResultsRef.current = updatedSearchResults;
        }
        updateRowsWithHistory(updatedGlobalRows, newChangedIds);
    };

    useEffect(() => {
        // Empty rows (that will be skipped by save anyway) should not trigger the unsaved changes warning.
        const hasValidNew = rows.some((r: any) => r.isNew && (r.name || r.tour_date || r.contact || r.receipt_date));
        const hasChanges = changedRowIds.size > 0;
        const isCurrentlyDirty = hasValidNew || hasChanges;
        setIsDirty(isCurrentlyDirty);

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isCurrentlyDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [rows, changedRowIds, setIsDirty]);

    // Reset global dirty state when leaving the page to prevent popups on other pages
    useEffect(() => {
        return () => {
            setIsDirty(false);
        };
    }, [setIsDirty]);

    useEffect(() => {
        registerSaveHandler(async () => {
            await handleSaveRef.current?.(false);
        });
    }, [registerSaveHandler]);

    useEffect(() => {
        handleSaveRef.current = async (isAutoSave = false) => {
            await handleSave(isAutoSave);
        };
    });

    const handleAddRow = (count: number = 1) => {
        const newRowsList = Array.from({ length: count }, () => createEmptyRow());
        const updatedRows = [...newRowsList, ...rows];
        updateRowsWithHistory(updatedRows, changedRowIds); // changedRowIds doesn't change for new rows (they use isNew)
        setShowAddMenu(false);
    };

    const openActionModal = useCallback((id: string, index: number) => {
        setActiveActionRow({ id, index });
    }, []);

    const handleRowAction = async (action: 'cancel' | 'delete' | 'waiting' | 'confirmed') => {
        if (!activeActionRow) return;
        const { id, index } = activeActionRow;
        const newRows = [...rows];
        const row = newRows[index] as any;

        try {
            if (action === 'delete') {
                if (row.isNew) {
                    newRows.splice(index, 1);
                    updateRowsWithHistory(newRows, changedRowIds);
                    alert("삭제되었습니다.");
                } else {
                    const { error } = await supabase.from("reservations").delete().eq("id", id);
                    if (error) throw error;
                    newRows.splice(index, 1);

                    const nextChangedIds = new Set(changedRowIds);
                    nextChangedIds.delete(id);

                    updateRowsWithHistory(newRows, nextChangedIds);
                    alert("데이터베이스에서 삭제되었습니다.");
                }
            } else {
                let newStatus = "";
                if (action === 'cancel') newStatus = "취소";
                else if (action === 'waiting') newStatus = "예약대기";
                else if (action === 'confirmed') newStatus = "예약확정";

                if (row.status === newStatus) {
                    setActiveActionRow(null);
                    return;
                }

                newRows[index] = { ...row, status: newStatus };

                const nextChangedIds = new Set(changedRowIds);
                if (!row.isNew) {
                    nextChangedIds.add(id);
                }
                updateRowsWithHistory(newRows, nextChangedIds);
            }
        } catch (error) {
            console.error("Action failed:", error);
            alert("작업 처리 중 오류가 발생했습니다.");
        } finally {
            setActiveActionRow(null);
        }
    };

    const handleBulkAction = async (action: 'cancel' | 'delete' | 'waiting' | 'confirmed') => {
        if (selectedRows.size === 0) return;
        if (action === 'delete' && !confirm(`선택한 ${selectedRows.size}개 항목을 정말 삭제하시겠습니까?`)) return;

        const selectedRowObjects = rows.filter(r => selectedRows.has((r as any)._grid_id));
        const newRows = [...rows];

        try {
            if (action === 'delete') {
                const idsToDeleteFromDb: string[] = [];
                selectedRowObjects.forEach(row => {
                    if (row.id && !row.id.startsWith('temp-')) {
                        idsToDeleteFromDb.push(row.id);
                    }
                });

                if (idsToDeleteFromDb.length > 0) {
                    const { error } = await supabase.from("reservations").delete().in("id", idsToDeleteFromDb);
                    if (error) throw error;
                }

                const updatedRows = newRows.filter(r => !selectedRows.has((r as any)._grid_id));

                const nextChangedIds = new Set(changedRowIds);
                selectedRowObjects.forEach(r => nextChangedIds.delete(r.id!));

                updateRowsWithHistory(updatedRows, nextChangedIds);

                setSelectedRows(new Set());
                alert("일괄 삭제되었습니다.");
            } else {
                let newStatus = "";
                if (action === 'cancel') newStatus = "취소";
                else if (action === 'waiting') newStatus = "예약대기";
                else if (action === 'confirmed') newStatus = "예약확정";

                const nextChangedIds = new Set(changedRowIds);

                const updatedRows = newRows.map(r => {
                    if (selectedRows.has((r as any)._grid_id)) {
                        if (!r.isNew && r.id) {
                            nextChangedIds.add(r.id!);
                        }
                        return { ...r, status: newStatus };
                    }
                    return r;
                });

                updateRowsWithHistory(updatedRows, nextChangedIds);
                setSelectedRows(new Set());
            }
        } catch (error) {
            console.error("Bulk action failed:", error);
            alert("일괄 작업 중 오류가 발생했습니다.");
        }
    };

    const handleSwapOrder = async (direction: 'up' | 'down') => {
        if (selectedRows.size !== 1) return;
        const selectedId = Array.from(selectedRows)[0];
        const currentIndex = rows.findIndex(r => r._grid_id === selectedId);

        if (currentIndex === -1) return;
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === rows.length - 1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const currentRow = rows[currentIndex];
        const targetRow = rows[targetIndex];

        if (currentRow.isNew || targetRow.isNew) {
            alert("저장되지 않은 새로운 예약은 순서를 변경할 수 없습니다. 먼저 저장해주세요.");
            return;
        }

        try {
            setSaving(true);

            // 1. Fetch current DB values for both rows
            const { data: dbData, error: fetchErr } = await supabase
                .from('reservations')
                .select('id, created_at, receipt_date')
                .in('id', [currentRow.id, targetRow.id]);

            if (fetchErr || !dbData || dbData.length !== 2) {
                console.error('Swap fetch error:', fetchErr, 'data:', dbData);
                throw new Error("DB에서 순서 정보를 가져올 수 없습니다. (ID 불일치 가능)");
            }

            const dbCurrent = dbData.find(d => d.id === currentRow.id);
            const dbTarget = dbData.find(d => d.id === targetRow.id);
            if (!dbCurrent || !dbTarget) throw new Error("서버 데이터 불일치");

            // 2. Prepare new values - swap created_at and receipt_date
            let newCurrentCreatedAt = dbTarget.created_at;
            let newTargetCreatedAt = dbCurrent.created_at;
            let newCurrentReceiptDate = dbTarget.receipt_date;
            let newTargetReceiptDate = dbCurrent.receipt_date;

            // If created_at values are identical, create an artificial 1-second gap
            if (dbCurrent.created_at === dbTarget.created_at) {
                const baseTime = new Date(dbCurrent.created_at).getTime();
                if (direction === 'up') {
                    // "Up" in DESC list = needs MORE recent timestamp to appear higher
                    newCurrentCreatedAt = new Date(baseTime + 1000).toISOString();
                    newTargetCreatedAt = new Date(baseTime).toISOString();
                } else {
                    newCurrentCreatedAt = new Date(baseTime).toISOString();
                    newTargetCreatedAt = new Date(baseTime + 1000).toISOString();
                }
            }

            // 3. Update row 1 with .select() to verify the write actually happened
            const { data: r1, error: e1 } = await supabase
                .from('reservations')
                .update({ created_at: newCurrentCreatedAt, receipt_date: newCurrentReceiptDate })
                .eq('id', currentRow.id!)
                .select('id, created_at, receipt_date');

            if (e1) {
                console.error('Swap update1 error:', e1);
                throw new Error("첫 번째 행 업데이트 실패: " + e1.message);
            }
            if (!r1 || r1.length === 0) {
                console.error('Swap update1 returned no rows. ID:', currentRow.id);
                throw new Error("첫 번째 행 업데이트 확인 실패 (0건 반영)");
            }

            // 4. Update row 2 with .select() to verify
            const { data: r2, error: e2 } = await supabase
                .from('reservations')
                .update({ created_at: newTargetCreatedAt, receipt_date: newTargetReceiptDate })
                .eq('id', targetRow.id!)
                .select('id, created_at, receipt_date');

            if (e2) {
                console.error('Swap update2 error:', e2);
                throw new Error("두 번째 행 업데이트 실패: " + e2.message);
            }
            if (!r2 || r2.length === 0) {
                console.error('Swap update2 returned no rows. ID:', targetRow.id);
                throw new Error("두 번째 행 업데이트 확인 실패 (0건 반영)");
            }

            // 5. Swap positions locally using the confirmed DB values
            const newRows = [...rows];
            const updatedCurrentRow = {
                ...currentRow as any,
                created_at: r1[0].created_at,
                receipt_date: r1[0].receipt_date
            };
            const updatedTargetRow = {
                ...targetRow as any,
                created_at: r2[0].created_at,
                receipt_date: r2[0].receipt_date
            };

            newRows[currentIndex] = updatedTargetRow;
            newRows[targetIndex] = updatedCurrentRow;

            updateRowsWithHistory(newRows, changedRowIds);

        } catch (err: any) {
            console.error('handleSwapOrder failed:', err);
            alert("순서 변경 실패: " + err.message);
        } finally {
            setSaving(false);
        }
    };


    const handleCopy = async () => {
        const start = parseInt(copyStartRow);
        const end = parseInt(copyEndRow);

        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
            alert("올바른 범위를 입력해주세요.");
            return;
        }

        // Logic:
        // 1. Convert "No." (Display ID) back to Array Index.
        const baseCount = totalCount > 0 ? totalCount : rows.length;

        let idx1 = baseCount - start;
        let idx2 = baseCount - end;

        // Ensure indices are valid
        if (idx1 < 0) idx1 = 0;
        if (idx2 < 0) idx2 = 0;
        if (idx1 >= rows.length) idx1 = rows.length - 1;
        if (idx2 >= rows.length) idx2 = rows.length - 1;

        const minIdx = Math.min(idx1, idx2);
        const maxIdx = Math.max(idx1, idx2);

        // Slice is end-exclusive, so +1
        const targetRows = rows.slice(minIdx, maxIdx + 1);

        if (targetRows.length === 0) {
            alert("선택된 범위에 데이터가 없습니다.");
            return;
        }

        // Create a copy to sort
        const sortedRows = [...targetRows].sort((a: any, b: any) => {
            const dateA = a.tour_date || "";
            const dateB = b.tour_date || "";
            const optionA = a.option || "";
            const optionB = b.option || "";

            // Primary sort: Date
            const dateCompare = dateA.localeCompare(dateB);
            if (dateCompare !== 0) return dateCompare;

            // Secondary sort: Option
            return optionA.localeCompare(optionB);
        });

        // 1. Get Receipt Date (from first row)
        // Format: M/d (e.g., 2/10)
        let receiptHeader = "접수일 미정";
        const firstRow = sortedRows[0] as any;
        if (firstRow?.receipt_date) {
            try {
                // receipt_date is YYYY-MM-DD
                const [y, m, d] = firstRow.receipt_date.split('-');
                receiptHeader = `${parseInt(m)}/${parseInt(d)}`;
            } catch (e) {
                receiptHeader = firstRow.receipt_date;
            }
        }

        let textToCopy = `${receiptHeader} 예약자명단\n\n`;

        // 2. Group by Date
        const grouped: { [key: string]: any[] } = {};
        sortedRows.forEach((row: any) => {
            const dateKey = formatDateDisplay(row.tour_date) || "날짜미정";
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(row);
        });

        // 3. Build String
        Object.entries(grouped).forEach(([dateStr, groupRows]) => {
            // Convert MM-DD-YYYY to *MM/DD/YYYY
            const dateSlash = dateStr.replace(/-/g, '/');
            const rawTourDate = (groupRows[0] as any).tour_date || "";
            const dayOfWeek = getKoreanDay(rawTourDate); // Fix: dateStr is MM-DD-YYYY, use raw YYYY-MM-DD
            textToCopy += `${dayOfWeek} ${dateSlash}\n`;

            groupRows.forEach((row: any) => {
                // [Source] Name / Pax / Option / Pickup
                const source = row.source ? `[${row.source}]` : "[-]";
                const name = row.name || "-";

                // Fix "명명" duplication
                let paxRaw = String(row.pax || "").replace(/명/g, "").trim();
                const pax = paxRaw ? `${paxRaw}명` : "-";

                const option = row.option || "-";
                const pickup = row.pickup_location || "-";
                const note = row.note || "";

                // Format: [Source] Name / Pax / Option / Pickup / Note
                let line = `${source} ${name} / ${pax} / ${option} / ${pickup}`;
                if (note) line += ` / ${note}`;

                textToCopy += `${line}\n\n`; // Double spacing between rows
            });

            textToCopy += `\n`; // Extra spacing between date groups
        });

        try {
            await navigator.clipboard.writeText(textToCopy);
            alert(`${sortedRows.length}건의 명단이 복사되었습니다.\n(여행일 기준 그룹화)`);
            setShowCopyModal(false);
            setCopyStartRow('');
            setCopyEndRow('');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert("클립보드 복사에 실패했습니다.");
        }
    };

    const handleOpenCopyModal = () => {
        if (selectedRows.size > 0) {
            // Calculate range from selections
            const selectedIndices: number[] = [];
            rows.forEach((r, idx) => {
                if (selectedRows.has((r as any)._grid_id) || (r.id && selectedRows.has(r.id))) {
                    selectedIndices.push(idx);
                }
            });

            if (selectedIndices.length > 0) {
                const minIdx = Math.min(...selectedIndices);
                const maxIdx = Math.max(...selectedIndices);

                // Convert Index back to No. using totalCount logic checks
                // Matches "No." column renderer: rowNumber = baseCount - idx
                const baseCount = totalCount > 0 ? totalCount : rows.length;
                const startNo = baseCount - maxIdx; // Lower No (Higher Index)
                const endNo = baseCount - minIdx;   // Higher No (Lower Index)

                setCopyStartRow(String(startNo));
                setCopyEndRow(String(endNo));
            }
        }
        setShowCopyModal(true);
    };

    const handleSave = async (isAutoSave = false) => {
        if (isSubmitting.current) {
            if (isAutoSave) triggerAutoSave();
            return;
        }
        isSubmitting.current = true;
        setSaving(true);

        // Read from refs to avoid stale closure (blur + click batching race)
        const latestRows = rowsRef.current;
        const latestSearchResults = searchResultsRef.current;
        const latestChangedIds = changedRowIdsRef.current;

        // Collect all unique available rows from both global rows and search results
        const availableRowsMap = new Map();
        latestRows.forEach(r => availableRowsMap.set(r.id || (r as any)._grid_id, r));
        if (latestSearchResults) {
            latestSearchResults.forEach(r => availableRowsMap.set(r.id || (r as any)._grid_id, r));
        }

        const isValidDateStr = (d: any) => {
            if (!d) return true;
            const str = String(d).trim();
            return /^\d{2,4}[-./]\d{1,2}[-./]\d{1,2}$/.test(str);
        };

        const skippedIds = new Set<string>();
        const toSave = Array.from(availableRowsMap.values()).filter(r => {
            const isChanged = (r as any).isNew || latestChangedIds.has(r.id!);
            if (!isChanged) return false;

            if (!isValidDateStr(r.tour_date) || !isValidDateStr(r.receipt_date)) {
                if (r.id) skippedIds.add(r.id);
                return false;
            }
            return true;
        });

        if (toSave.length === 0) {
            if (!isAutoSave) alert("저장할 변경사항이 없습니다.");
            setSaving(false);
            isSubmitting.current = false;
            return;
        }

        try {
            const inserts: any[] = [];
            const updates: any[] = [];
            const actualInsertedLocalRows: any[] = [];

            const newRowsToSave = toSave.filter(r => (r as any).isNew);
            const needsDefaultDate = newRowsToSave.some(r => !r.receipt_date);

            let latestDbDate = "";
            if (needsDefaultDate) {
                const { data } = await supabase
                    .from("reservations")
                    .select("receipt_date")
                    .order("receipt_date", { ascending: false })
                    .limit(1)
                    .single();
                if (data?.receipt_date) {
                    latestDbDate = data.receipt_date;
                }
            }

            let batchMaxDate = "";
            newRowsToSave.forEach(r => {
                if (r.receipt_date && r.receipt_date > batchMaxDate) {
                    batchMaxDate = r.receipt_date;
                }
            });

            const defaultDateToUse = (batchMaxDate > latestDbDate ? batchMaxDate : latestDbDate) || getHawaiiDateStr();

            const insertBaseTime = Date.now();

            toSave.forEach(r => {
                const row = r as any;
                if (!row.name && !row.tour_date && !row.contact && !row.receipt_date) return;

                if (row.isNew) {
                    const { id, isNew, created_at, _grid_id, _capacityMsg, _capacityStatus, ...rest } = row;

                    let isReconfirmed = false;
                    if (typeof rest.is_reconfirmed === 'boolean') isReconfirmed = rest.is_reconfirmed;
                    if (typeof rest.is_reconfirmed === 'string') {
                        const lower = (rest.is_reconfirmed as string).toLowerCase();
                        isReconfirmed = lower === 't' || lower === 'true' || lower === 'y';
                    }

                    const receiptDate = rest.receipt_date || defaultDateToUse;
                    const status = rest.status || "예약확정";

                    actualInsertedLocalRows.push(row);
                    inserts.push({
                        ...rest,
                        tour_date: rest.tour_date || null,
                        pax: rest.pax || null,
                        receipt_date: receiptDate,
                        status: status,
                        is_reconfirmed: isReconfirmed,
                        is_admin_checked: true,
                        option: rest.option || "",
                        pickup_location: rest.pickup_location || "",
                        contact: rest.contact || "",
                        note: rest.note || "",
                        source: rest.source || "",
                    });
                } else {
                    const { _grid_id, _capacityMsg, _capacityStatus, ...cleanRow } = row;
                    if (!cleanRow.receipt_date) {
                        cleanRow.receipt_date = getHawaiiDateStr();
                    }
                    if (cleanRow.tour_date === "") cleanRow.tour_date = null;
                    if (cleanRow.pax === "") cleanRow.pax = null;
                    
                    // Admin explicitly modified this row, so mark it as checked
                    cleanRow.is_admin_checked = true;
                    
                    updates.push(cleanRow);
                }
            });

            inserts.forEach((item, idx) => {
                item.created_at = new Date(insertBaseTime - idx * 1000).toISOString();
            });

            let insertedData: any[] | null = null;
            if (inserts.length > 0) {
                const { data, error: insertError } = await supabase.from("reservations").insert(inserts).select();
                if (insertError) throw insertError;
                insertedData = data;
            }

            if (updates.length > 0) {
                const { error: updateError } = await supabase.from("reservations").upsert(updates);
                if (updateError) throw updateError;
            }

            const cleanRows = (arr: any[]) => {
                let modified = false;
                const newArr = arr.map(r => {
                    if (r.isNew) {
                        const insertIdx = actualInsertedLocalRows.findIndex(ir => ir._grid_id === r._grid_id);
                        if (insertIdx !== -1 && insertedData && insertedData[insertIdx]) {
                            modified = true;
                            const dbRow = insertedData[insertIdx];
                            const { isNew, ...rest } = r;
                            return { ...rest, id: dbRow.id, receipt_date: dbRow.receipt_date, created_at: dbRow.created_at };
                        }
                    }
                    return r;
                });
                return modified ? newArr : arr;
            };

            const updatedGlobal = cleanRows(rowsRef.current);
            if (updatedGlobal !== rowsRef.current) {
                setRows(updatedGlobal);
                rowsRef.current = updatedGlobal;
            }

            if (searchResultsRef.current) {
                const updatedSearch = cleanRows(searchResultsRef.current);
                if (updatedSearch !== searchResultsRef.current) {
                    setSearchResults(updatedSearch);
                    searchResultsRef.current = updatedSearch;
                }
            }

            setChangedRowIds(skippedIds);
            changedRowIdsRef.current = skippedIds;

            if (!isAutoSave) {
                alert(`저장 완료 (추가: ${inserts.length}건, 수정: ${updates.length}건)`);
                // fetchReservations를 호출하지 않음으로써, 아직 저장되지 않은 빈 행이나 유효하지 않은 행이
                // 그리드에서 갑자기 사라져 아래쪽 행이 위로 당겨져 보이는(데이터가 덮어씌워진 것처럼 보이는) 버그를 방지합니다.
            }
        } catch (error: any) {
            console.error("Save error details:", JSON.stringify(error, null, 2), error);
            alert(`저장 중 오류가 발생했습니다.\n${error?.message || JSON.stringify(error) || '알 수 없는 오류'}`);
        } finally {
            setSaving(false);
            isSubmitting.current = false;
        }
    };

    const commonCellRenderer = (props: any) => (
        <div
            className="w-full h-full flex items-center px-2 select-none pointer-events-none"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
        >
            {props.row[props.column.key as keyof Reservation]}
        </div>
    );

    // Hover Tooltip Renderer for all cells
    // Hover Tooltip Renderer for all cells
    const hoverTooltipRenderer = (props: any, centerAlign = false, noTruncate = false, expandable = false) => {
        const cellValue = props.row[props.column.key];

        return (
            <div
                className={`flex ${centerAlign ? 'justify-center' : 'justify-start'} items-center h-full w-full hover:bg-yellow-100 transition-colors duration-200`}
                onMouseEnter={(e) => {
                    if (expandable && cellValue) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ content: cellValue, rect });
                    }
                }}
                onMouseLeave={() => setTooltip(null)}
            >
                <div className={`w-full px-2 ${noTruncate ? '' : 'truncate'} ${centerAlign ? 'text-center' : ''}`}>
                    {cellValue}
                </div>
            </div>
        );
    };

    const columns = useMemo(() => [
        {
            key: "no_col",
            name: "No.",
            width: 50,
            cellClass: "select-none text-center no-col-bg", // Use explicit class with !important
            headerCellClass: "text-center",
            renderCell: ({ row, tabIndex }: any) => {
                // Find index in current rows
                const idx = rows.indexOf(row);
                // Reverse numbering: Total Count - Index
                // Use rows.length as base if we have loaded everything (hasMore is false), otherwise rely on totalCount
                const baseCount = (!hasMore && rows.length > 0) ? rows.length : (totalCount > 0 ? totalCount : rows.length);
                const rowNumber = baseCount - idx;
                return <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs">{rowNumber}</div>;
            }
        },
        {
            key: "select_col",
            name: "선택",
            width: 50,
            cellClass: "select-none",
            headerCellClass: "text-center",
            renderCell: ({ row }: any) => {
                const isSelected = selectedRows.has(row._grid_id);
                const idx = rows.indexOf(row); // Get current index

                return (
                    <div className="flex justify-center h-full items-center" key={`select-cell-${row._grid_id}`}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => {
                                // Handle Shift+Click for range selection
                                const currentIdx = idx;
                                let newSelected = new Set(selectedRows);

                                if (e.shiftKey && lastSelectedIdx !== -1) {
                                    const start = Math.min(lastSelectedIdx, currentIdx);
                                    const end = Math.max(lastSelectedIdx, currentIdx);

                                    // Determine if we are adding or removing based on the clicked row's new state
                                    const willBeSelected = !isSelected;

                                    for (let i = start; i <= end; i++) {
                                        const r = rows[i];
                                        if (r && (r as any)._grid_id) {
                                            if (willBeSelected) newSelected.add((r as any)._grid_id);
                                            else newSelected.delete((r as any)._grid_id);
                                        }
                                    }
                                } else {
                                    if (isSelected) {
                                        newSelected.delete(row._grid_id);
                                    } else {
                                        newSelected.add(row._grid_id);
                                    }
                                    setLastSelectedIdx(currentIdx);
                                }
                                setSelectedRows(newSelected);
                            }}
                            onChange={() => { }} // Handle change in onClick to catch shift key properly
                            className="cursor-pointer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                );
            }
        },
        {
            key: "receipt_date",
            name: "접수일",
            renderEditCell: CustomTextEditor,
            width: 100,
            cellClass: "select-none p-0",
            headerCellClass: "text-center",
            renderCell: (props: any) => {
                const displayValue = formatDateDisplay(props.row.receipt_date);
                return hoverTooltipRenderer({ ...props, row: { ...props.row, receipt_date: displayValue } }, false, true);
            },
            editorOptions: { commitOnOutsideClick: true }
        },
        {
            key: "status",
            name: "상태",
            renderEditCell: StatusEditor,
            width: 80,
            cellClass: "select-none p-0 text-center",
            headerCellClass: "text-center",
            editorOptions: { commitOnOutsideClick: true },
            renderCell: ({ row }: any) => {
                const status = row.status;
                let className = "text-gray-600";
                if (status === "예약확정") className = "text-green-600 font-bold";
                else if (status === "예약대기") className = "text-yellow-600 font-bold";
                else if (status === "취소요청") className = "text-orange-600 font-bold";
                else if (status === "취소") className = "text-red-600 font-bold line-through";

                return (

                    <div
                        className="flex justify-center items-center h-full w-full hover:bg-yellow-100 transition-colors duration-200"
                    >
                        <span key={`status-${row.id}`} className={className} draggable={false} onDragStart={e => e.preventDefault()}>{status}</span>
                    </div>
                );
            }
        },
        { key: "source", name: "경로", renderEditCell: CustomTextEditor, width: 80, cellClass: "select-none p-0 text-center", headerCellClass: "text-center", renderCell: (props: any) => hoverTooltipRenderer(props, true, true), editorOptions: { commitOnOutsideClick: true } },
        {
            key: "name",
            name: "예약자명",
            // Always-Edit Mode - renderEditCell removed to prevent conflict
            width: 90,
            cellClass: "p-0 text-center",
            headerCellClass: "text-center",
            renderCell: (props: any) => {
                const idx = rows.indexOf(props.row);
                // Check if this cell is selected
                // Note: props.column.idx is reliable.
                const isSelected = selectedCell?.rowIdx === idx && selectedCell?.idx === props.column.idx;

                return (
                    <CustomTextEditor
                        {...props}
                        isAlwaysOn={true}
                        isSelected={isSelected}
                        textAlign="center"
                        onRowChange={(newRow: any) => handleSingleRowChangeDirectRef.current(newRow)}
                        onNavigate={(action) => handleEditorNavigation(action, idx, props.column.idx)}
                    />
                );
            },
        },
        {
            key: "tour_date",
            name: "예약일",
            renderEditCell: CustomTextEditor,
            width: 100,
            cellClass: "select-none p-0 text-center",
            headerCellClass: "text-center",
            renderCell: (props: any) => {
                const isSelected = selectedCell?.rowIdx === props.row.id && selectedCell?.idx === props.column.idx; // Use row.id or row index depending on logic
                // Actually rowKeyGetter uses _grid_id or id. We need to match current row index.
                // grid props.rowIdx is available in modern RDG, but here props might be just { row, column, onRowChange... }
                // Let's check if we can get rowIdx. In RDG v7 renderCell props usually include rowIdx?
                // Wait, in the 'name' column we access `props.rowIdx` or we rely on `isSelected` passed from parent? 
                // Ah, 'name' column loop in previous code (Line 1145) uses `const isSelected = selectedCell?.rowIdx === i ...` 
                // but here we are in `columns` array definition. accurately getting rowIdx in renderCell can be tricky if not passed.
                // However, `renderCell` props in RDG usually have `rowIdx`.
                // Let's assume `props.rowIdx` is valid.

                // Wait, `columns` is defined *inside* the component in this file?
                // Yes, `const columns = useMemo(...)`.
                // So we can access `selectedCell` from closure.

                // Wait, `columns` is defined *inside* the component in this file?
                // Yes, `const columns = useMemo(...)`.
                // So we can access `selectedCell` from closure.

                const displayValue = formatDateDisplay(props.row.tour_date);
                return hoverTooltipRenderer({ ...props, row: { ...props.row, tour_date: displayValue } }, true, true);
            },
            editorOptions: { commitOnOutsideClick: true }
        },
        {
            key: "day_of_week", name: "요일", width: 50,
            cellClass: "select-none p-0 text-center", headerCellClass: "text-center",
            renderCell: ({ row }: any) => {
                const day = getKoreanDayShort(row.tour_date || "");
                return (
                    // Default style (inherit) for Mon-Sat. Red for Sun.
                    <div className={`w-full h-full flex items-center justify-center ${day === '일' ? 'text-red-500 font-bold' : ''}`}>
                        {day}
                    </div>
                );
            }
        },
        { key: "pax", name: "인원", renderEditCell: CustomTextEditor, width: 60, cellClass: "select-none p-0 text-center", headerCellClass: "text-center", renderCell: (props: any) => hoverTooltipRenderer(props, true), editorOptions: { commitOnOutsideClick: true } },
        {
            key: "option", name: "옵션", renderEditCell: CustomTextEditor, width: 90, // Widened slightly for badges
            cellClass: "select-none p-0 text-center", headerCellClass: "text-center",
            renderCell: ({ row }: any) => {
                const status = row._capacityStatus;
                const msg = row._capacityMsg;
                const resolved = resolveOptionToTourSetting(row.option || "", tourSettings);
                const showBadge = resolved.tourSetting && resolved.vessel !== '오션스타';
                const badgeColorClass = getVesselBadgeColor(resolved.vessel);

                let indicator = null;
                if (status === 'checking') {
                    indicator = <span className="text-gray-500 text-xs ml-1 animate-spin">⌛</span>;
                } else if (status === 'warning') {
                    indicator = <span className="text-red-600 font-bold ml-1 text-xs">⚠️</span>;
                } else if (status === 'safe') {
                    indicator = <span className="text-blue-500 font-bold ml-1 text-xs">✓</span>;
                }

                return (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-0.5 leading-tight ${status === 'warning' ? 'bg-red-50' : ''}`} title={msg || row.option}>
                        <div className="flex items-center">
                            <span>{row.option}</span>
                            {indicator}
                        </div>
                        {showBadge && (
                            <span className={`text-[9px] px-1 py-[1px] mt-0.5 rounded shadow-sm flex items-center gap-0.5 ${badgeColorClass}`}>
                                {getShortLabel(resolved.vessel)}
                            </span>
                        )}
                    </div>
                );
            },
            editorOptions: { commitOnOutsideClick: true }
        },
        {
            key: "pickup_location",
            name: "픽업장소",
            renderEditCell: (props: any) => <ComboSelectEditor {...props} options={PICKUP_LOCATIONS} />,
            width: 140,
            cellClass: "p-0 text-center",
            headerCellClass: "text-center",
            renderCell: (props: any) => {
                return <div className="w-full h-full flex items-center justify-center px-1">{props.row.pickup_location}</div>;
            },
            editorOptions: { commitOnOutsideClick: true }
        },
        {
            key: "contact",
            name: "연락처",
            renderEditCell: CustomTextEditor,
            width: 130,
            cellClass: "p-0",
            headerCellClass: "text-center",
            renderCell: (props: any) => {
                // Always-Edit might be overkill for contact numbers, but consistent UX is better.
                // User asked for Pickup and Note. I'll omit Contact for now to be safe, or just do it?
                // User said "Pickup Location and Note". I'll stick to those to be precise.
                return hoverTooltipRenderer(props, false);
            },
            editorOptions: { commitOnOutsideClick: true }
        },
        {
            key: "booker_email",
            name: "이메일",
            renderEditCell: CustomTextEditor,
            width: 160,
            cellClass: "p-0",
            headerCellClass: "text-center",
            renderCell: (props: any) => {
                const idx = rows.indexOf(props.row);
                const isSelected = selectedCell?.rowIdx === idx && selectedCell?.idx === props.column.idx;
                return (
                    <CustomTextEditor
                        {...props}
                        isAlwaysOn={true}
                        isSelected={isSelected}
                        onRowChange={(newRow: any) => handleSingleRowChangeDirectRef.current(newRow)}
                        onNavigate={(action) => handleEditorNavigation(action, idx, props.column.idx)}
                    />
                );
            }
        },
        {
            key: "note",
            name: "기타사항",
            // renderEditCell removed for Always-Edit
            width: noteColWidth,
            cellClass: "p-0",
            headerCellClass: "text-center",
            renderCell: (props: any) => {
                const idx = rows.indexOf(props.row);
                const isSelected = selectedCell?.rowIdx === idx && selectedCell?.idx === props.column.idx;
                return (
                    <CustomTextEditor
                        {...props}
                        isAlwaysOn={true}
                        isSelected={isSelected}
                        onRowChange={(newRow: any) => handleSingleRowChangeDirectRef.current(newRow)}
                        onNavigate={(action) => handleEditorNavigation(action, idx, props.column.idx)}
                    />
                );
            }
        },
    ], [selectedRows, rows, lastSelectedIdx, noteColWidth, tourSettings]);

    // Shift+Click Range Selection + Mobile Double-Tap Edit
    const handleCellClick = useCallback((args: any, event: any) => {
        const clickedCell = { idx: args.column.idx, rowIdx: args.rowIdx };

        // Skip non-editable columns
        if (args.column.key === 'select_col' || args.column.key === 'actions_col') {
            return;
        }

        if (event.shiftKey && anchorCell) {
            const startCol = Math.min(anchorCell.idx, clickedCell.idx);
            const endCol = Math.max(anchorCell.idx, clickedCell.idx);
            const startRow = Math.min(anchorCell.rowIdx, clickedCell.rowIdx);
            const endRow = Math.max(anchorCell.rowIdx, clickedCell.rowIdx);

            setRangeSelection({ startCol, endCol, startRow, endRow });
            console.log('📦 범위 선택:', { startCol, endCol, startRow, endRow });
        } else {
            setAnchorCell(clickedCell);
            setRangeSelection(null);
        }

        setSelectedCell(clickedCell);
        setTooltip(null); // Clear tooltip to prevent obscuring editor
    }, [anchorCell, isMobile]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if ((event.key === 'Delete' || event.key === 'Backspace') && rangeSelection) {
            if (searchQuery.trim() || searchResults) {
                alert('검색 중에는 일괄 삭제 기능을 사용할 수 없습니다. 개별 셀 수정을 이용해주세요.');
                return;
            }

            const { startCol, endCol, startRow, endRow } = rangeSelection;
            const keysToClear: string[] = [];

            for (let i = startCol; i <= endCol; i++) {
                const colKey = columns[i].key;
                if (colKey !== 'select_col' && colKey !== 'actions_col') {
                    keysToClear.push(colKey);
                }
            }

            if (keysToClear.length === 0) return;

            setRows(prevRows => {
                const newRows = [...prevRows];
                const changedIds = new Set<string>();

                for (let r = startRow; r <= endRow; r++) {
                    if (r >= 0 && r < newRows.length) {
                        const row = newRows[r];
                        let modified = false;
                        const newRow = { ...row };

                        keysToClear.forEach(key => {
                            if ((newRow as any)[key] !== "") {
                                (newRow as any)[key] = "";
                                modified = true;
                            }
                        });

                        if (modified) {
                            newRows[r] = newRow;
                            if (newRow.id && !newRow.isNew) {
                                changedIds.add(newRow.id);
                            }
                        }
                    }
                }

                if (changedIds.size > 0) {
                    setChangedRowIds(prev => {
                        const next = new Set(prev);
                        changedIds.forEach(id => next.add(id));
                        changedRowIdsRef.current = next;
                        return next;
                    });
                }

                return newRows;
            });
        }
    }, [rangeSelection, columns, searchQuery, searchResults]);

    const rowClass = (row: any) => {
        const classes: string[] = [];
        if (row.isNew) classes.push("bg-blue-50/50");
        if (row.status === "취소") classes.push("bg-red-50 text-gray-400 line-through");
        if (highlightId && row.id === highlightId) classes.push("highlight-row");
        return classes.join(" ");
    };

    // DB-level search: query Supabase directly so results aren't limited to loaded rows
    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setSearchResults(null);
            searchResultsRef.current = null;
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                let normalizedQuery = query;

                // Special handling for tour_date: normalize date formats
                if (searchCriteria === 'tour_date') {
                    const dateMatch = normalizedQuery.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                    if (dateMatch) {
                        const [, month, day, year] = dateMatch;
                        normalizedQuery = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                }

                const { data, error } = await supabase
                    .from('reservations')
                    .select('*')
                    .ilike(searchCriteria, `%${normalizedQuery}%`)
                    .order('receipt_date', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(200);

                if (error) throw error;

                const sanitized = ensureUniqueIds(data || []);
                setSearchResults(sanitized);
                searchResultsRef.current = sanitized;
            } catch (err) {
                console.error('Search error:', err);
                // Fallback: filter locally
                const localQuery = query.toLowerCase();
                const localFiltered = rows.filter(row => {
                    const value = String((row as any)[searchCriteria] || '').toLowerCase();
                    return value.includes(localQuery);
                });
                setSearchResults(localFiltered);
                searchResultsRef.current = localFiltered;
            } finally {
                setIsSearching(false);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, searchCriteria]);

    // Filter rows based on search
    const filteredRows = useMemo(() => {
        if (!searchQuery.trim()) return rows;
        if (searchResults !== null) return searchResults;
        return rows; // While searching, show all rows (isSearching indicator handles UX)
    }, [rows, searchQuery, searchResults]);

    // Range overlay calculation
    const rangeOverlayStyle = useMemo(() => {
        if (!rangeSelection) return null;

        const ROW_HEIGHT = 35;
        const HEADER_HEIGHT = 40;

        let leftOffset = 0;
        for (let i = 0; i < rangeSelection.startCol; i++) {
            leftOffset += columns[i].width || 100;
        }

        let width = 0;
        for (let i = rangeSelection.startCol; i <= rangeSelection.endCol; i++) {
            width += columns[i].width || 100;
        }

        const top = HEADER_HEIGHT + rangeSelection.startRow * ROW_HEIGHT;
        const height = (rangeSelection.endRow - rangeSelection.startRow + 1) * ROW_HEIGHT;

        return {
            position: 'absolute' as const,
            left: `${leftOffset}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: '2px solid #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none' as const,
            zIndex: 10
        };
    }, [rangeSelection, columns]);

    return (
        <div className="flex h-full flex-col space-y-4 contain-strict" onKeyDown={handleKeyDown} tabIndex={0}>
            <style jsx global>{`
                .contain-strict {
                    contain: size layout paint style; 
                }
                ${fullHeightGridStyle}
            `}</style>

            <div className="relative z-20 flex shrink-0 flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">전체 예약 관리</h2>
                    {!isMobile && (
                        <p className="text-sm text-gray-500">
                            <strong>Shift+Click</strong>으로 범위 선택, <strong>Delete</strong>로 삭제
                        </p>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">{/* Search Section */}
                    <div className="flex gap-2 items-center">
                        <select
                            value={searchCriteria}
                            onChange={(e) => setSearchCriteria(e.target.value as any)}
                            className="rounded-md border border-gray-300 px-2 md:px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white flex-shrink-0"
                        >
                            <option value="name">예약자명</option>
                            <option value="source">경로</option>
                            <option value="tour_date">예약일</option>
                            <option value="contact">연락처</option>
                        </select>
                        <input
                            type="text"
                            placeholder="검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 sm:w-48 md:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                title="검색 초기화"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleOpenCopyModal}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 md:px-4 md:py-2 rounded-md text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
                    >
                        명단복사
                    </button>

                    <div className="inline-flex rounded-md shadow-sm isolate">
                        <button
                            onClick={() => handleAddRow(1)}
                            className="relative inline-flex items-center gap-1 md:gap-2 rounded-l-md border border-blue-200 bg-white px-3 py-2 md:px-4 md:py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 focus:z-10 whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            행 추가
                        </button>
                        <div className="relative -ml-px block">
                            <button
                                onClick={() => setShowAddMenu(!showAddMenu)}
                                className="relative inline-flex items-center rounded-r-md border border-blue-200 bg-white px-2 py-2 text-blue-600 hover:bg-blue-50 focus:z-10"
                            >
                                <span className="text-xs">▼</span>
                            </button>
                            {showAddMenu && (
                                <div className="absolute right-0 top-full mt-1 w-32 origin-top-right bg-white border border-gray-200 shadow-lg rounded-md z-[100] overflow-hidden">
                                    {[10, 20, 30, 50, 100, 200].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleAddRow(num)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700"
                                        >
                                            +{num}행 추가
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showAddMenu && <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Undo Buttons */}
                        <div className="flex items-center border border-gray-300 rounded-md bg-white mr-2">
                            <button
                                onClick={handleUndo}
                                disabled={historyIndex <= 0}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-gray-200"
                                title="실행 취소 (Ctrl+Z)"
                            >
                                <Undo className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={historyIndex >= history.length - 1}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                title="다시 실행 (Ctrl+Y)"
                            >
                                <Redo className="h-4 w-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300 shadow-sm transition-colors"
                        >
                            <Save className="h-3 w-3 md:h-4 md:w-4" />
                            {saving ? "저장..." : "저장"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Result Indicator */}
            {searchQuery && (
                <div className="relative z-10 px-4 pb-2">
                    <p className="text-sm text-gray-600">
                        {isSearching ? (
                            <span className="text-blue-500 font-medium">검색 중...</span>
                        ) : (
                            <><strong>{filteredRows.length}</strong>개의 검색 결과 (DB 전체 검색)</>
                        )}
                    </p>
                </div>
            )}

            {selectedRows.size > 0 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50">
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                        {selectedRows.size}개 선택됨
                    </span>
                    <div className="h-4 w-px bg-gray-300" />
                    <div className="flex items-center gap-2">
                        {selectedRows.size === 1 && (
                            <>
                                <button
                                    onClick={() => handleSwapOrder('up')}
                                    className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 flex items-center gap-1"
                                >
                                    <span>▲</span> 위로
                                </button>
                                <button
                                    onClick={() => handleSwapOrder('down')}
                                    className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 flex items-center gap-1"
                                >
                                    <span>▼</span> 아래로
                                </button>
                                <div className="h-4 w-px bg-gray-300 mx-1" />
                            </>
                        )}
                        <button
                            onClick={() => handleBulkAction('confirmed')}
                            className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        >
                            예약확정
                        </button>
                        <button
                            onClick={() => handleBulkAction('waiting')}
                            className="px-3 py-1.5 text-xs font-bold bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100"
                        >
                            예약대기
                        </button>
                        <button
                            onClick={() => handleBulkAction('cancel')}
                            className="px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                        >
                            취소처리
                        </button>
                        <div className="h-4 w-px bg-gray-300 mx-1" />
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm"
                        >
                            일괄삭제
                        </button>
                        <button
                            onClick={() => setSelectedRows(new Set())}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )
            }

            {/* Tab Navigation */}
            <div className="flex items-center space-x-1 border-b border-gray-200 mb-4 bg-white px-2 pt-2 rounded-t-lg">
                <button
                    onClick={() => setActiveTab('input')}
                    className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'input' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    예약 입력 (전체 관리)
                </button>
                <button
                    onClick={() => setActiveTab('cancellation')}
                    className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'cancellation' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    취소 요청
                    <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">New</span>
                </button>
                <button
                    onClick={() => setActiveTab('reschedule')}
                    className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'reschedule' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    변경 요청
                    <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">New</span>
                </button>
            </div>

            {activeTab === 'cancellation' ? (
                <CancellationRequestsView />
            ) : activeTab === 'reschedule' ? (
                <RescheduleRequestsView />
            ) : (
                <div ref={gridContainerRef} className="flex-1 w-full rounded-md border border-gray-300 bg-white shadow-sm min-h-0 flex flex-col relative">
                    {rangeOverlayStyle && <div style={rangeOverlayStyle} />}

                    {loading && rows.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            데이터를 불러오는 중입니다...
                        </div>
                    ) : (
                        <>
                            <style>{fullHeightGridStyle}{highlightFlashStyle}</style>
                            <DataGrid
                                ref={gridRef}
                                defaultColumnOptions={{ resizable: true }}
                                columns={columns}
                                rows={filteredRows}
                                onRowsChange={handleRowsChange}
                                onFill={handleFill}
                                className="rdg-light h-full text-sm flex-1 datagrid-overflow-visible outline-none"
                                headerRowHeight={40}
                                rowHeight={35}
                                rowClass={rowClass}
                                rowKeyGetter={(row) => String((row as any)._grid_id || row.id)}
                                onScroll={handleScroll}
                                selectedRows={selectedRows}
                                onSelectedRowsChange={setSelectedRows}
                                onSelectedCellChange={(args: any) => {
                                    // RDG v7 onSelectedCellChange args: { rowIdx, column } usually, or { rowIdx, idx }
                                    // We'll check both for safety or rely on column.idx if available
                                    const idx = args.column?.idx ?? args.idx;
                                    if (typeof idx === 'number') {
                                        setSelectedCell({ rowIdx: args.rowIdx, idx });
                                    }
                                }}
                                onCellClick={handleCellClick}
                                onCellDoubleClick={isMobile ? (args, event) => {
                                    if (selectedCell &&
                                        selectedCell.idx === args.column.idx &&
                                        selectedCell.rowIdx === args.rowIdx) {
                                        return;
                                    }
                                } : undefined}
                                direction="ltr"
                                style={{ height: "100%", userSelect: "none" }}
                            />
                        </>
                    )}
                    {loading && rows.length > 0 && (
                        <div className="py-2 text-center text-xs text-gray-400 bg-gray-50 border-t">
                            추가 데이터 로딩 중...
                        </div>
                    )}
                    {tooltip && createPortal(
                        <div
                            className="fixed bg-yellow-100 text-gray-900 px-2 pointer-events-none z-[99999] whitespace-nowrap flex items-center justify-center transform-none"
                            style={{
                                top: tooltip.rect.top,
                                left: tooltip.rect.left,
                                height: tooltip.rect.height,
                                minWidth: tooltip.rect.width,
                            }}
                        >
                            {tooltip.content}
                        </div>,
                        document.body
                    )}
                </div>
            )}

            {activeActionRow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">상태 변경 및 삭제</h3>
                            <p className="text-sm text-gray-500 mb-6">원하시는 작업을 선택해주세요.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleRowAction('confirmed')}
                                    className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold"
                                >
                                    예약확정 (상태변경)
                                </button>
                                <button
                                    onClick={() => handleRowAction('waiting')}
                                    className="w-full py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-bold"
                                >
                                    예약대기 (상태변경)
                                </button>
                                <button
                                    onClick={() => handleRowAction('cancel')}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                                >
                                    취소 (상태변경)
                                </button>
                                <hr className="border-gray-100 my-1" />
                                <button
                                    onClick={() => handleRowAction('delete')}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm"
                                >
                                    삭제 (DB 영구삭제)
                                </button>
                                <button
                                    onClick={() => setActiveActionRow(null)}
                                    className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg font-semibold mt-2"
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCopyModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">명단 복사 (범위 선택)</h3>
                        <p className="text-sm text-gray-500">
                            No. 컬럼의 번호를 확인하여 복사할 범위를 입력해주세요.<br />
                            <span className="text-xs text-blue-600">* 복사 시 예약일(Tour Date) 순으로 자동 정렬됩니다.</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="시작 No."
                                value={copyStartRow}
                                onChange={(e) => setCopyStartRow(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                autoFocus
                            />
                            <span className="text-gray-400">~</span>
                            <input
                                type="number"
                                placeholder="끝 No."
                                value={copyEndRow}
                                onChange={(e) => setCopyEndRow(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowCopyModal(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                복사하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

export default function AllReservationsPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <AllReservationsContent />
        </Suspense>
    );
}
