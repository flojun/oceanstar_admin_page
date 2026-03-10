"use client";

import "react-data-grid/lib/styles.css";
import React, { useState, useEffect, useRef } from "react";
import { DataGrid, RenderEditCellProps, FillEvent, RenderCellProps, Column } from "react-data-grid";
import { Save, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ReservationInsert } from "@/types/reservation";
import { smartParseRow } from "@/lib/smartParser";
import { getHawaiiDateStr } from "@/lib/timeUtils";
import { useUnsavedChanges } from "@/components/providers/UnsavedChangesProvider";
import type { TourSetting } from "@/lib/tourUtils";
import { resolveOptionToTourSetting, getVesselBadgeColor, getShortLabel } from "@/lib/tourUtils";

// Custom styles for Excel-like look
const excelStyles = `
  .rdg-cell {
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
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
  .rdg-selected-range {
    border: 2px solid #2563eb !important;
    background-color: rgba(37, 99, 235, 0.1) !important;
    z-index: 100 !important;
    pointer-events: none;
  }
  .overbooking-warning {
    background-color: #fee2e2 !important; /* Red 100 */
    color: #b91c1c !important; /* Red 700 */
  }
  .overbooking-safe {
    background-color: #eff6ff !important; /* Blue 50 */
    color: #1d4ed8 !important; /* Blue 700 */
  }
`;

// Extended Row Type
type GridRow = Partial<ReservationInsert> & {
    id: string;
    _grid_id: string;
    // Overbooking Info
    _capacityMsg?: string;
    _capacityStatus?: 'checking' | 'safe' | 'warning';
};

// Simple text editor
function TextEditor({ row, column, onRowChange, onClose }: RenderEditCellProps<GridRow>) {
    return (
        <input
            className="h-full w-full border-none bg-transparent px-2 py-1 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            autoFocus
            value={(row[column.key as keyof ReservationInsert] as string) || ""}
            onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
            onBlur={() => onClose(true)}
        />
    );
}

const createEmptyRow = (): GridRow => ({
    id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    _grid_id: crypto.randomUUID(),
    status: "",
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
    _capacityStatus: undefined,
});

const initialRows = Array.from({ length: 50 }, () => createEmptyRow());

export default function BulkAddPage() {
    const [rows, setRows] = useState<GridRow[]>(initialRows);
    const [saving, setSaving] = useState(false);
    const [tourSettings, setTourSettings] = useState<TourSetting[]>([]);

    useEffect(() => {
        supabase.from('tour_settings').select('*').order('display_order').then(({ data }) => {
            if (data) setTourSettings(data);
        });
    }, []);

    const { setIsDirty, handleNavigationAttempt, registerSaveHandler } = useUnsavedChanges();

    // Register Save Handler for Modal
    const handleSaveRef = useRef<() => Promise<void>>(undefined);

    useEffect(() => {
        handleSaveRef.current = async () => {
            // We need to call the internal handleSave logic here
            // But handleSave is defined inside the component and depends on state.
            // We can just wrap it.
            await handleSave();
        };
    });

    useEffect(() => {
        registerSaveHandler(async () => {
            if (handleSaveRef.current) {
                await handleSaveRef.current();
            }
        });
    }, [registerSaveHandler]);


    // Common Renderer
    const commonCellRenderer = (props: RenderEditCellProps<GridRow>) => (
        <div className="w-full h-full flex items-center px-2 select-none pointer-events-none">
            {props.row[props.column.key as keyof ReservationInsert]}
        </div>
    );

    // Columns
    const columns = [
        { key: "receipt_date", name: "접수일", renderEditCell: TextEditor, width: 100, renderCell: commonCellRenderer },
        {
            key: "is_reconfirmed", name: "리컨펌", renderEditCell: TextEditor, width: 60,
            renderCell: ({ row }: RenderCellProps<GridRow>) => <div className="w-full h-full flex items-center px-2">{row.is_reconfirmed ? "T" : ""}</div>
        },
        { key: "status", name: "상태", renderEditCell: TextEditor, width: 80, renderCell: commonCellRenderer },
        { key: "source", name: "경로", renderEditCell: TextEditor, width: 80, renderCell: commonCellRenderer },
        { key: "name", name: "예약자명", renderEditCell: TextEditor, width: 100, renderCell: commonCellRenderer },
        { key: "tour_date", name: "예약일", renderEditCell: TextEditor, width: 100, renderCell: commonCellRenderer },
        { key: "pax", name: "인원", renderEditCell: TextEditor, width: 60, renderCell: commonCellRenderer },
        {
            key: "option", name: "옵션(자동체크)", renderEditCell: TextEditor, width: 130, // Widened for badge
            renderCell: ({ row }: RenderCellProps<GridRow>) => {
                const status = row._capacityStatus;
                const msg = row._capacityMsg;
                const resolved = resolveOptionToTourSetting(row.option || "", tourSettings);
                const showBadge = resolved.tourSetting && resolved.vessel !== '오션스타';
                const badgeColorClass = getVesselBadgeColor(resolved.vessel);

                let indicator = <span className="text-gray-300 ml-1 text-[10px]">•</span>;
                if (status === 'checking') indicator = <span className="text-gray-500 text-xs ml-1 animate-spin">⌛</span>;
                else if (status === 'warning') indicator = <span className="text-red-600 font-bold ml-1 text-xs">⚠️</span>;
                else if (status === 'safe') indicator = <span className="text-blue-500 font-bold ml-1 text-xs">✓</span>;

                return (
                    <div className={`w-full h-full flex items-center px-1 leading-tight ${status === 'warning' ? 'bg-red-50' : ''}`} title={msg || row.option}>
                        <div className="flex items-center">
                            <span>{row.option}</span>
                            {indicator}
                        </div>
                        {showBadge && (
                            <span className={`ml-1 text-[9px] px-1 py-[1px] rounded shadow-sm flex items-center ${badgeColorClass}`}>
                                {getShortLabel(resolved.vessel)}
                            </span>
                        )}
                    </div>
                );
            }
        },
        { key: "pickup_location", name: "픽업장소", renderEditCell: TextEditor, width: 140, renderCell: commonCellRenderer },
        { key: "contact", name: "연락처", renderEditCell: TextEditor, width: 120, renderCell: commonCellRenderer },
        { key: "note", name: "기타사항", renderEditCell: TextEditor, width: 140, renderCell: commonCellRenderer },
    ];


    const parsePax = (str: string): number => {
        if (!str) return 0;
        const num = parseInt(str.toString().replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? 0 : num;
    };

    const handleRowsChange = (newRows: GridRow[]) => {
        // Mark as dirty when rows change
        setIsDirty(true);

        // Smart Parsing & Overbooking Check
        const processedRows = newRows.map((row, i) => {
            const parsed = smartParseRow(row);
            const oldRow = rows[i];

            // Check diff
            const changed = row.tour_date !== oldRow.tour_date || row.option !== oldRow.option || row.pax !== oldRow.pax;

            // Should check?
            if (changed && row.tour_date && row.option && row.pax) {
                // Trigger Check IMMEDIATELY (Async update later)
                // We mark as checking first
                checkOverbookingForGrid(row, i);
                return { ...parsed, _capacityStatus: 'checking', _grid_id: oldRow._grid_id };
            }

            // Maintain existing status if not changed
            if (!changed) {
                return { ...parsed, _capacityMsg: oldRow._capacityMsg, _capacityStatus: oldRow._capacityStatus, _grid_id: oldRow._grid_id };
            }

            return { ...parsed, _grid_id: oldRow._grid_id };
        });
        setRows(processedRows as GridRow[]);
    };

    const checkOverbookingForGrid = async (row: GridRow, index: number) => {
        const resolved = resolveOptionToTourSetting(row.option || "", tourSettings);
        if (!resolved.tourSetting) {
            setRows(prev => {
                const updated = [...prev];
                if (updated[index]) updated[index]._capacityStatus = undefined;
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
                .select("pax, option")
                .eq("tour_date", row.tour_date)
                .neq("status", "취소");

            if (error) throw error;

            let dbTotal = 0;
            if (data) {
                data.forEach(r => {
                    const rResolved = resolveOptionToTourSetting(r.option || "", tourSettings);
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
                if (updated[index] && updated[index]._grid_id === row._grid_id) {
                    updated[index]._capacityStatus = isOver ? 'warning' : 'safe';
                    updated[index]._capacityMsg = msg;
                }
                return updated;
            });

        } catch (err) {
            console.error(err);
        }
    };

    // Standard Grid Handlers (Fill, KeyDown, Add, Save)
    const handleFill = ({ columnKey, sourceRow, targetRow }: FillEvent<GridRow>) => {
        const sourceIndex = rows.findIndex((r) => r._grid_id === sourceRow._grid_id);
        const targetIndex = rows.findIndex((r) => r._grid_id === targetRow._grid_id);
        if (sourceIndex === -1 || targetIndex === -1) return rows;

        const startIndex = Math.min(sourceIndex, targetIndex);
        const endIndex = Math.max(sourceIndex, targetIndex);
        const sourceValue = sourceRow[columnKey as keyof ReservationInsert];
        const newRows = [...rows];

        for (let i = startIndex; i <= endIndex; i++) {
            newRows[i] = {
                ...newRows[i],
                [columnKey]: sourceValue,
            };
        }
        setRows(newRows);
        setIsDirty(true); // Fill also marks as dirty
        return newRows as any;
    };



    const handleAddManyRows = () => setRows(prev => [...prev, ...Array.from({ length: 200 }, () => createEmptyRow())]);

    const handleSave = async () => {
        setSaving(true);
        const validRows = rows.filter(r => r.name && r.tour_date);

        if (validRows.length === 0) {
            alert("저장할 데이터가 없습니다. (최소한 이름, 예약일, 접수일은 필수입니다)");
            setSaving(false);
            return;
        }

        const insertData = validRows.map(r => {
            // ... Logic identical to original ...
            let isReconfirmed = false;
            if (typeof r.is_reconfirmed === 'boolean') isReconfirmed = r.is_reconfirmed;
            if (String(r.is_reconfirmed) === 'T' || String(r.is_reconfirmed) === 'true') isReconfirmed = true;

            return {
                status: r.status || "예약확정",
                receipt_date: r.receipt_date || getHawaiiDateStr(),
                source: r.source || "",
                name: r.name,
                tour_date: r.tour_date,
                pax: r.pax || "",
                option: r.option || "",
                pickup_location: r.pickup_location || "",
                contact: r.contact || "",
                note: r.note || "",
                is_reconfirmed: isReconfirmed
            };
        });

        try {
            const { error } = await supabase.from("reservations").insert(insertData as any);
            if (error) throw error;
            alert(`${insertData.length}건이 저장되었습니다.`);
            setRows(Array.from({ length: 50 }, () => createEmptyRow()));
            setIsDirty(false); // Reset dirty after save
        } catch (error) {
            console.error(error);
            alert("저장 실패");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        // Attempt to navigate away. If dirty, UnsavedChangesProvider will intercept.
        // We navigate to /dashboard/all (Reservation Management) or Home.
        handleNavigationAttempt('/dashboard/all');
    };

    return (
        <div className="flex h-full flex-col space-y-4">
            <style jsx global>{excelStyles}</style>

            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">엑셀 방식 대량 추가</h2>
                    <div className="bg-red-500 text-white font-bold p-2 my-2 rounded animate-pulse">
                        DEBUG MODE: IF YOU SEE THIS, THE FILE IS CORRECT.
                    </div>
                    <p className="text-sm text-gray-500">날짜(1/30), 단축어(m, z), 인원(1) 등 자동 변환 + 오버부킹 실시간 체크</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleClose} className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                        <X className="h-4 w-4" />
                        닫기
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:bg-green-400">
                        <Save className="h-4 w-4" />
                        {saving ? "저장 중..." : "전체 저장"}
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden min-h-[500px]">
                <DataGrid
                    columns={columns as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                    rows={rows}
                    onRowsChange={handleRowsChange}
                    onFill={handleFill}
                    className="rdg-light h-full text-sm"
                    headerRowHeight={40}
                    rowHeight={35}
                    rowKeyGetter={(row) => row._grid_id}
                />
            </div>
            <div className="flex justify-between items-center shrink-0 py-2">
                <div className="text-xs text-gray-500">* 필수값: 접수일, 예약일, 예약자명</div>
                <button onClick={handleAddManyRows} className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                    <Plus className="h-4 w-4" /> 200행 추가
                </button>
            </div>
        </div>
    );
}
