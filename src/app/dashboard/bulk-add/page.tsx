"use client";

import "react-data-grid/lib/styles.css";
import React, { useState, useMemo } from "react";
import { DataGrid, RenderEditCellProps, FillEvent } from "react-data-grid";
// import type { SelectedRange } from "react-data-grid";
import { Save, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ReservationInsert } from "@/types/reservation";
import { smartParseRow } from "@/lib/smartParser";
import { getHawaiiDateStr } from "@/lib/timeUtils";

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
  /* Ensure Selection Box is Visible */
  .rdg-selected-range {
    border: 2px solid #2563eb !important;
    background-color: rgba(37, 99, 235, 0.1) !important;
    z-index: 100 !important;
    pointer-events: none;
  }
`;

// Simple text editor component
function TextEditor({ row, column, onRowChange, onClose }: RenderEditCellProps<any>) {
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

// Helper to create an empty row with initialized strings to prevent "uncontrolled" errors
const createEmptyRow = (): Partial<ReservationInsert> & { id: string } => ({
    // Use robust unique ID (timestamp + random)
    id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    _grid_id: crypto.randomUUID(), // UI Exclusive Key
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
    is_reconfirmed: false, // Boolean should be false, not ""
});

// Create initial 50 rows
const initialRows = Array.from({ length: 50 }, () => createEmptyRow());

export default function BulkAddPage() {
    const [rows, setRows] = useState<(Partial<ReservationInsert> & { id: string })[]>(initialRows);
    const [selectedRange, setSelectedRange] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    // Columns definition
    // Columns definition
    // Common Cell Renderer to prevent drag issues
    const commonCellRenderer = (props: RenderEditCellProps<any>) => (
        <div
            className="w-full h-full flex items-center px-2 select-none pointer-events-none"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
        >
            {props.row[props.column.key as keyof ReservationInsert]}
        </div>
    );

    // Columns definition
    const columns = [
        { key: "receipt_date", name: "접수일(1/30)", renderEditCell: TextEditor, width: 100, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        {
            key: "is_reconfirmed",
            name: "리컨펌(T/F)",
            renderEditCell: TextEditor,
            width: 90,
            cellClass: "select-none",
            editorOptions: { editOnClick: false, commitOnOutsideClick: true },
            renderCell: ({ row }: any) => <div className="pointer-events-none w-full h-full flex items-center">{row.is_reconfirmed ? "T" : ""}</div>
        },
        { key: "status", name: "상태", renderEditCell: TextEditor, width: 80, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "source", name: "경로(m,z...)", renderEditCell: TextEditor, width: 100, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "name", name: "예약자명", renderEditCell: TextEditor, width: 100, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "tour_date", name: "예약일(1/30)", renderEditCell: TextEditor, width: 100, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "pax", name: "인원(1)", renderEditCell: TextEditor, width: 80, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "option", name: "옵션(1)", renderEditCell: TextEditor, width: 80, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "pickup_location", name: "픽업장소", renderEditCell: TextEditor, width: 160, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "contact", name: "연락처", renderEditCell: TextEditor, width: 130, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
        { key: "note", name: "기타사항", renderEditCell: TextEditor, width: 160, cellClass: "select-none", editorOptions: { editOnClick: false, commitOnOutsideClick: true }, renderCell: commonCellRenderer },
    ];

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if ((event.key === 'Delete' || event.key === 'Backspace') && selectedRange) {

            const { idx, rowIdx, endIdx, endRowIdx: rangeEndRowIdx } = selectedRange;

            const startColIdx = Math.min(idx, endIdx);
            const endColIdx = Math.max(idx, endIdx);
            const startRowIdx = Math.min(rowIdx, rangeEndRowIdx);
            const endRowIdx = Math.max(rowIdx, rangeEndRowIdx);

            const keysToClear: string[] = [];
            for (let i = startColIdx; i <= endColIdx; i++) {
                const colKey = columns[i].key;
                keysToClear.push(colKey);
            }

            if (keysToClear.length === 0) return;

            setRows(prevRows => {
                const newRows = [...prevRows];

                for (let r = startRowIdx; r <= endRowIdx; r++) {
                    if (r >= 0 && r < newRows.length) {
                        const row = newRows[r];
                        const newRow = { ...row };

                        keysToClear.forEach(key => {
                            if ((newRow as any)[key] !== "") {
                                (newRow as any)[key] = "";
                            }
                        });
                        newRows[r] = newRow;
                    }
                }
                return newRows;
            });
        }
    };


    // ... inside component
    const handleRowsChange = (newRows: Partial<ReservationInsert>[]) => {
        // Smart Parsing Logic using shared utility & preserve UI key
        const processedRows = newRows.map((row, i) => ({
            ...smartParseRow(row),
            _grid_id: (rows[i] as any)._grid_id
        }));
        setRows(processedRows);
    };

    const handleFill = ({ columnKey, sourceRow, targetRow }: FillEvent<any>) => {
        // [핵심 수정] id 대신 _grid_id로 정확한 인덱스 탐색
        const sourceIndex = rows.findIndex((r) => (r as any)._grid_id === sourceRow._grid_id);
        const targetIndex = rows.findIndex((r) => (r as any)._grid_id === targetRow._grid_id);

        // 안전장치: 인덱스를 못 찾으면 중단
        if (sourceIndex === -1 || targetIndex === -1) return rows;

        const startIndex = Math.min(sourceIndex, targetIndex);
        const endIndex = Math.max(sourceIndex, targetIndex);

        const sourceValue = sourceRow[columnKey];
        const newRows = [...rows];

        for (let i = startIndex; i <= endIndex; i++) {
            newRows[i] = {
                ...newRows[i],
                [columnKey]: sourceValue,
                // _grid_id는 절대 건드리지 않음 (자동으로 유지됨)
            };
        }

        setRows(newRows);
        return newRows;
    };

    const handleAddRow = () => {
        // Add 1 empty row
        setRows((prev) => [...prev, createEmptyRow()]);
    };

    const handleAddManyRows = () => {
        // Add 200 empty rows
        const newRows = Array.from({ length: 200 }, () => createEmptyRow());
        setRows((prev) => [...prev, ...newRows]);
    };

    const handleSave = async () => {
        setSaving(true);
        // Filter out empty rows (must have at least name or tour_date)
        // Filter out empty rows (must have at least name or tour_date - receipt_date is auto-filled)
        const validRows = rows.filter(r => r.name && r.tour_date);

        if (validRows.length === 0) {
            alert("저장할 데이터가 없습니다. (최소한 이름, 예약일, 접수일은 필수입니다)");
            setSaving(false);
            return;
        }

        // Prepare data for Insert
        const insertData = validRows.map(r => {
            // Handle boolean conversion loosely
            let isReconfirmed = false;
            if (typeof r.is_reconfirmed === 'boolean') isReconfirmed = r.is_reconfirmed;
            if (typeof r.is_reconfirmed === 'string') {
                const lower = (r.is_reconfirmed as string).toLowerCase();
                isReconfirmed = lower === 't' || lower === 'true' || lower === 'y';
            }

            // Default Values Logic
            const receiptDate = r.receipt_date || getHawaiiDateStr();
            const status = r.status || "예약확정";

            return {
                ...r,
                receipt_date: receiptDate,
                status: status,
                is_reconfirmed: isReconfirmed,
                // Ensure strings are strings
                option: r.option || "",
                pax: r.pax || "",
                pickup_location: r.pickup_location || "",
                contact: r.contact || "",
                note: r.note || "",
                source: r.source || "",
            };
        });

        try {
            const { error } = await supabase.from("reservations").insert(insertData as any);

            if (error) throw error;

            alert(`${insertData.length}건이 저장되었습니다.`);
            // Reset to initial 50 empty rows
            setRows(Array.from({ length: 50 }, () => createEmptyRow()));
        } catch (error) {
            console.error("Bulk save error:", error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-full flex-col space-y-4">
            {/* Inject Styles */}
            <style jsx global>{excelStyles}</style>

            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">엑셀 방식 대량 추가</h2>
                    <p className="text-sm text-gray-500">
                        날짜(1/30 &rarr; 2026-01-30), 단축어(m, z) 등 자동 변환.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:bg-green-400 shadow-sm transition-colors"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "저장 중..." : "전체 저장"}
                    </button>
                </div>
            </div>

            {/* Grid Container - Full Height */}
            <div className="flex-1 w-full rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden min-h-[500px]">
                <DataGrid
                    columns={columns}
                    rows={rows}
                    onRowsChange={handleRowsChange}
                    onFill={handleFill}

                    selectedRange={selectedRange}
                    onSelectedRangeChange={setSelectedRange}
                    onKeyDown={handleKeyDown}
                    cellNavigationMode="CHANGE_CELL"
                    className="rdg-light h-full text-sm flex-1"
                    headerRowHeight={40}
                    rowHeight={35}
                    rowKeyGetter={(row) => (row as any)._grid_id || (row as any).id}
                />
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center shrink-0 py-2">
                <div className="text-xs text-gray-500">
                    * 필수값: 접수일, 예약일, 예약자명
                </div>
                <button
                    onClick={handleAddManyRows}
                    className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    200행 추가
                </button>
            </div>
        </div>
    );
}
