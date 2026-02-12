"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, addDays, startOfWeek, subWeeks, addWeeks, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Save, Plus, Trash2, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { useUnsavedChanges } from "@/components/providers/UnsavedChangesProvider";
import { toPng } from 'html-to-image';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
type CrewMember = {
    id: string;
    name: string;
    sort_order: number;
};

type Captain = {
    id: string;
    name: string;
};

type Role = 'CREW' | 'MC';

type CrewSchedule = {
    id: string;
    crew_id: string;
    date: string; // YYYY-MM-DD
    option: string; // "1부", "2부", "3부"
    role: Role;
};

type ShiftCaptain = {
    date: string;
    option: string;
    captain_id: string;
};

// Sortable Item Component
function SortableCrewItem({
    crew,
    index,
    total,
    onMove,
    onDelete
}: {
    crew: CrewMember;
    index: number;
    total: number;
    onMove: (index: number, direction: 'left' | 'right') => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: crew.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 rounded-lg border border-gray-200 text-xs shadow-sm cursor-move touch-none relative group"
        >
            <div className="text-gray-300 cursor-grab active:cursor-grabbing mr-1" {...listeners}>
                <GripVertical className="w-3 h-3" />
            </div>

            <div className="flex flex-col gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onMove(index, 'left')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-blue-500 disabled:opacity-30"
                >
                    <ChevronLeft className="w-3 h-3" />
                </button>
            </div>

            <span className="font-medium text-gray-700 px-1 select-none" {...listeners}>{crew.name}</span>

            <div className="flex flex-col gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onMove(index, 'right')}
                    disabled={index === total - 1}
                    className="text-gray-400 hover:text-blue-500 disabled:opacity-30"
                >
                    <ChevronRight className="w-3 h-3" />
                </button>
            </div>

            <div className="w-[1px] h-3 bg-gray-300 mx-1"></div>

            <button
                onClick={() => onDelete(crew.id)}
                className="text-gray-400 hover:text-red-500 z-10"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
}

export default function CrewPage() {
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [captains, setCaptains] = useState<Captain[]>([]);
    const [schedules, setSchedules] = useState<CrewSchedule[]>([]);
    const [shiftCaptains, setShiftCaptains] = useState<ShiftCaptain[]>([]);
    const [memo, setMemo] = useState("");
    const memoRef = useRef<HTMLTextAreaElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Unsaved Changes
    const { setIsDirty, registerSaveHandler } = useUnsavedChanges();
    const [initialMemo, setInitialMemo] = useState<string | null>(null);

    // Auto-resize memo textarea
    useEffect(() => {
        if (memoRef.current) {
            memoRef.current.style.height = 'auto';
            memoRef.current.style.height = `${memoRef.current.scrollHeight}px`;
        }
    }, [memo]);

    const [newCrewName, setNewCrewName] = useState("");
    const [newCaptainName, setNewCaptainName] = useState("");
    const [loading, setLoading] = useState(true);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Grid Helpers
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const OPTIONS = ["1부", "2부", "3부"];

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const startStr = format(weekDates[0], "yyyy-MM-dd");
            const endStr = format(weekDates[6], "yyyy-MM-dd");

            // Run all queries in parallel for faster loading
            const [crewRes, captainRes, scheduleRes, shiftCaptainRes, memoRes] = await Promise.all([
                supabase.from("crew_members").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
                supabase.from("captains").select("*").order("created_at"),
                supabase.from("crew_schedules").select("*").gte("date", startStr).lte("date", endStr),
                supabase.from("shift_captains").select("*").gte("date", startStr).lte("date", endStr),
                supabase.from("crew_memos").select("content").eq("id", 1).single(),
            ]);

            const sortedCrew = (crewRes.data || []).map((c, i) => ({
                ...c,
                sort_order: c.sort_order ?? i
            }));
            setCrew(sortedCrew);
            setCaptains(captainRes.data || []);
            setSchedules(scheduleRes.data || []);
            setShiftCaptains(shiftCaptainRes.data || []);

            const memoContent = memoRes.data?.content || "";
            setMemo(memoContent);
            setInitialMemo(memoContent);
            setIsDirty(false); // Reset dirty state on fresh load

        } catch (error) {
            console.error("Error fetching crew data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    // Check for changes
    useEffect(() => {
        if (initialMemo === null) return; // Loading
        if (memo !== initialMemo) {
            setIsDirty(true);
        } else {
            setIsDirty(false);
        }
    }, [memo, initialMemo, setIsDirty]);

    // Handlers
    const handleSaveMemo = async () => {
        try {
            const { error } = await supabase.from("crew_memos").upsert({ id: 1, content: memo });
            if (error) throw error;
            alert("메모가 저장되었습니다.");
            setInitialMemo(memo); // Update initial state
            setIsDirty(false);
        } catch (e) { console.error(e); }
    };

    // Register save handler
    useEffect(() => {
        registerSaveHandler(handleSaveMemo);
    }, [registerSaveHandler, memo]); // Dependencies need to include memo so the closure captures current memo

    // Other Handlers
    const handleAddCrew = async () => {
        if (!newCrewName.trim()) return;
        try {
            const maxOrder = crew.length > 0 ? Math.max(...crew.map(c => c.sort_order)) : -1;
            await supabase.from("crew_members").insert([{ name: newCrewName, sort_order: maxOrder + 1 }]);
            setNewCrewName("");
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCrew = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 관련 스케줄도 모두 삭제됩니다.")) return;
        await supabase.from("crew_members").delete().eq("id", id);
        fetchData();
    };

    // Reorder Handlers
    const updateCrewOrder = async (newCrewList: CrewMember[]) => {
        // Optimistic
        setCrew(newCrewList);
        try {
            const updates = newCrewList.map((c, i) => ({
                id: c.id,
                sort_order: i,
                name: c.name
            }));
            const { error } = await supabase.from('crew_members').upsert(updates);
            if (error) throw error;
        } catch (e) {
            console.error(e);
            fetchData();
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCrew((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Trigger async update
                updateCrewOrder(newItems);
                return items;
            });
        }
    };

    // Explicit Move (Left/Right)
    const handleMoveCrew = async (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return;
        if (direction === 'right' && index === crew.length - 1) return;

        const newCrew = [...crew];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;

        const temp = newCrew[index];
        newCrew[index] = newCrew[targetIndex];
        newCrew[targetIndex] = temp;
        updateCrewOrder(newCrew);
    };

    const handleDownloadImage = async () => {
        if (isExporting) return;
        setIsExporting(true);
        const sc = gridRef.current;
        if (!sc) { setIsExporting(false); return; }
        const tbl = sc.querySelector('table') as HTMLTableElement;
        if (!tbl) { setIsExporting(false); return; }

        try {
            // 1. Determine unassigned days
            const uDays: number[] = [];
            weekDates.forEach((d, i) => {
                if (!schedules.some(s => s.date === format(d, "yyyy-MM-dd"))) uDays.push(i);
            });
            const hideSun = uDays.includes(0);
            const bDays = uDays.filter(i => !(hideSun && i === 0));

            // 2. Deep clone with computed styles -> inline styles (bypasses React & ensures style snapshot)
            // Also preserves Select values
            const cloneWithStyles = (src: Element): Element => {
                const clone = src.cloneNode(false) as HTMLElement;
                if (src instanceof HTMLElement) {
                    const cs = getComputedStyle(src);
                    let cssText = '';
                    for (let i = 0; i < cs.length; i++) {
                        const prop = cs[i];
                        cssText += prop + ':' + cs.getPropertyValue(prop) + ';';
                    }
                    clone.style.cssText = cssText;

                    // Manual fix for Select elements: copy value
                    if (src instanceof HTMLSelectElement) {
                        (clone as HTMLSelectElement).value = src.value;
                        const idx = src.selectedIndex;
                        // We also need to manipulate children options later if we want 'selected' attribute,
                        // but setting .value on the clone *after* appending children is usually better.
                        // However, since we clone children recursively below, we can set attribute on the option.
                    }
                }

                // Clone children recursively
                src.childNodes.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        clone.appendChild(child.cloneNode(true));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const childClone = cloneWithStyles(child as Element);
                        clone.appendChild(childClone);

                        // If parent was select and this child is the selected option, mark it
                        if (src instanceof HTMLSelectElement && child instanceof HTMLOptionElement) {
                            if (child.selected) {
                                (childClone as HTMLOptionElement).setAttribute('selected', 'true');
                                (childClone as HTMLOptionElement).selected = true;
                            }
                        }
                    }
                });

                // Final value set for select
                if (src instanceof HTMLSelectElement) {
                    (clone as HTMLSelectElement).value = src.value;
                }

                return clone;
            };

            const clone = cloneWithStyles(tbl) as HTMLTableElement;

            // 3. Position Clone Correctly
            clone.style.position = 'absolute';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.zIndex = '-9999';
            clone.style.margin = '0';
            clone.style.transform = 'none';
            clone.style.width = tbl.scrollWidth + 'px';
            clone.style.minWidth = tbl.scrollWidth + 'px';
            clone.style.maxWidth = 'none';
            clone.style.height = tbl.scrollHeight + 'px';

            clone.querySelectorAll('th, td').forEach(el => {
                const h = el as HTMLElement;
                h.style.position = 'static';
                h.style.left = 'auto';
                h.style.top = 'auto';
                h.style.zIndex = 'auto';
            });

            const hRows = clone.querySelectorAll('thead tr');
            const bRows = clone.querySelectorAll('tbody tr');

            // 4. Hide Sunday column if unassigned
            if (hideSun) {
                if (hRows[0]) {
                    const t = hRows[0].querySelectorAll('th');
                    if (t[1]) (t[1] as HTMLElement).style.display = 'none';
                }
                [hRows[1], hRows[2]].forEach(r => {
                    if (!r) return;
                    const c = r.querySelectorAll('th');
                    for (let s = 0; s < 3; s++) if (c[s]) (c[s] as HTMLElement).style.display = 'none';
                });
                bRows.forEach(r => {
                    const c = r.querySelectorAll('td');
                    for (let s = 0; s < 3; s++) if (c[1 + s]) (c[1 + s] as HTMLElement).style.display = 'none';
                });
            }

            // 5. Blackout unassigned days
            bDays.forEach(di => {
                // Header rows 1,2 (options + captains)
                [hRows[1], hRows[2]].forEach(r => {
                    if (!r) return;
                    const c = r.querySelectorAll('th');
                    for (let s = 0; s < 3; s++) {
                        const ci = di * 3 + s;
                        if (c[ci]) {
                            const el = c[ci] as HTMLElement;
                            el.style.backgroundColor = '#000000';
                            el.style.color = '#000000';
                            el.textContent = '';
                            Array.from(el.children).forEach(child => {
                                (child as HTMLElement).style.display = 'none';
                            });
                        }
                    }
                });
                // Body rows
                bRows.forEach(r => {
                    const c = r.querySelectorAll('td');
                    for (let s = 0; s < 3; s++) {
                        const ci = 1 + di * 3 + s;
                        if (c[ci]) {
                            const td = c[ci] as HTMLElement;
                            td.style.backgroundColor = '#000000';
                            td.style.color = '#000000';
                            td.textContent = '';
                            Array.from(td.children).forEach(child => {
                                (child as HTMLElement).style.display = 'none';
                            });
                        }
                    }
                });
            });

            // 6. Append clone, capture, remove
            document.body.appendChild(clone);
            await new Promise(resolve => requestAnimationFrame(resolve));

            const dataUrl = await toPng(clone, {
                cacheBust: true,
                backgroundColor: 'white',
                pixelRatio: 2,
                fontEmbedCSS: '',
            });

            document.body.removeChild(clone);

            // 7. Download
            const link = document.createElement('a');
            link.download = `crew-schedule-${format(weekDates[0], "yyyy-MM-dd")}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Image export error:', err);
            alert("이미지 저장 실패");
        } finally {
            setIsExporting(false);
        }
    };

    // --- Repaired Handlers Below ---

    // Moved handleSaveMemo up to register it


    const handleAddCaptain = async () => {
        if (!newCaptainName.trim()) return;
        try {
            await supabase.from("captains").insert([{ name: newCaptainName }]);
            setNewCaptainName("");
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCaptain = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        await supabase.from("captains").delete().eq("id", id);
        fetchData();
    };

    // Grid Logic
    const handleShiftCaptainChange = async (date: Date, option: string, captainId: string) => {
        const dateStr = format(date, "yyyy-MM-dd");
        setShiftCaptains(prev => {
            const exists = prev.find(sc => sc.date === dateStr && sc.option === option);
            if (exists) {
                if (!captainId) return prev.filter(sc => !(sc.date === dateStr && sc.option === option));
                return prev.map(sc => sc.date === dateStr && sc.option === option ? { ...sc, captain_id: captainId } : sc);
            }
            if (captainId) return [...prev, { date: dateStr, option, captain_id: captainId }];
            return prev;
        });
        try {
            if (!captainId) await supabase.from("shift_captains").delete().match({ date: dateStr, option });
            else await supabase.from("shift_captains").upsert({ date: dateStr, option, captain_id: captainId }, { onConflict: "date, option" });
        } catch (e) { console.error(e); fetchData(); }
    };

    const getShiftCaptain = (date: Date, option: string) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return shiftCaptains.find(sc => sc.date === dateStr && sc.option === option)?.captain_id || "";
    };

    const toggleSchedule = async (crewId: string, date: Date, option: string) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const currentSchedule = schedules.find(s => s.crew_id === crewId && s.date === dateStr && s.option === option);

        let nextRole: Role | null = null;
        if (!currentSchedule) nextRole = 'CREW';
        else if (currentSchedule.role === 'CREW') nextRole = 'MC';
        else nextRole = null;

        const tempId = `temp-${Date.now()}`;
        setSchedules(prev => {
            if (currentSchedule) {
                if (!nextRole) return prev.filter(s => s.id !== currentSchedule.id);
                return prev.map(s => s.id === currentSchedule.id ? { ...s, role: nextRole! } : s);
            }
            if (nextRole) return [...prev, { id: tempId, crew_id: crewId, date: dateStr, option, role: nextRole }];
            return prev;
        });

        try {
            if (!nextRole) await supabase.from("crew_schedules").delete().match({ crew_id: crewId, date: dateStr, option: option });
            else await supabase.from("crew_schedules").upsert({ crew_id: crewId, date: dateStr, option: option, role: nextRole }, { onConflict: "crew_id, date, option" });
        } catch (e) { console.error(e); fetchData(); }
    };

    const getScheduleRole = (crewId: string, date: Date, option: string) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return schedules.find(s => s.crew_id === crewId && s.date === dateStr && s.option === option)?.role;
    };


    return (
        <div className="p-2 md:p-6 space-y-4 max-w-[1800px] mx-auto w-full">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">크루 스케쥴 관리</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Captains */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">캡틴 관리</h2>
                    <div className="flex flex-wrap gap-2">
                        {captains.map((c) => (
                            <div key={c.id} className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full border border-purple-200 text-xs">
                                <span className="font-medium text-purple-700">{c.name}</span>
                                <button onClick={() => handleDeleteCaptain(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        ))}
                        <div className="flex items-center gap-1">
                            <input value={newCaptainName} onChange={(e) => setNewCaptainName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCaptain()} placeholder="이름" className="px-2 py-1 border rounded text-xs w-16" />
                            <button onClick={handleAddCaptain} className="p-1 bg-purple-500 text-white rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                    </div>
                </div>

                {/* Crew (DnD) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">크루 관리 (드래그하여 순서 변경)</h2>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={crew.map(c => c.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="flex flex-wrap gap-2">
                                {crew.map((c, index) => (
                                    <SortableCrewItem
                                        key={c.id}
                                        crew={c}
                                        index={index}
                                        total={crew.length}
                                        onMove={handleMoveCrew}
                                        onDelete={handleDeleteCrew}
                                    />
                                ))}
                                <div className="flex items-center gap-1 ml-2">
                                    <input value={newCrewName} onChange={(e) => setNewCrewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCrew()} placeholder="이름" className="px-2 py-1 border rounded text-xs w-16" />
                                    <button onClick={handleAddCrew} className="p-1 bg-green-500 text-white rounded"><Plus className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* Memo */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-sm font-bold text-gray-800">특이사항</h2>
                    <button onClick={handleSaveMemo} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"><Save className="w-4 h-4" /> 저장</button>
                </div>
                <textarea
                    ref={memoRef}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full min-h-[3rem] p-2 border rounded focus:ring-2 focus:ring-blue-500 resize-none text-sm overflow-hidden"
                    placeholder="메모..."
                    rows={1}
                />
            </div>

            {/* Grid */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200">

                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft /></button>
                        <span className="font-bold text-base whitespace-nowrap">{format(weekDates[0], "yyyy.MM.dd")} ~ {format(weekDates[6], "MM.dd")}</span>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-gray-200 rounded"><ChevronRight /></button>
                        <div className="w-32 overflow-hidden"><DatePicker value={format(weekDates[0], "yyyy-MM-dd")} onChange={(d) => setCurrentDate(new Date(d))} /></div>
                    </div>
                    <button
                        onClick={handleDownloadImage}
                        disabled={isExporting}
                        className={`flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-transform z-10 ${isExporting ? 'opacity-70 cursor-wait' : 'active:scale-95'}`}
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        {isExporting ? '저장 중...' : '이미지 저장'}
                    </button>
                </div>

                <div ref={gridRef} className="w-full overflow-x-auto border rounded shadow-inner pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full border-collapse text-xs table-fixed min-w-[1000px] bg-white">
                        <thead className="bg-green-800 text-white">
                            <tr>
                                <th rowSpan={3} className="border border-green-700 w-20 p-1 bg-gray-100 text-gray-800 sticky left-0 z-30 shadow-md">
                                    <div className="text-[10px] text-gray-500">{format(weekDates[0], "M/d")}-{format(weekDates[6], "M/d")}</div>
                                    <div className="font-bold">CAPTAIN</div>
                                </th>
                                {weekDates.map(date => (
                                    <th key={'day-' + date.toString()} colSpan={3} className={`border p-1 font-bold text-center ${format(date, 'E') === 'Sun' ? 'bg-red-600 border-red-500' : 'bg-green-800 border-green-600'}`}>
                                        {format(date, "EEE").toUpperCase()}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-gray-100 text-gray-800">
                                {weekDates.map(date => (
                                    OPTIONS.map(opt => (
                                        <th key={'opt-' + date + opt} className="border border-gray-300 p-0.5 text-center w-10 font-semibold bg-green-50">
                                            {opt.replace('부', '')}
                                        </th>
                                    ))
                                ))}
                            </tr>
                            <tr className="bg-white">
                                {weekDates.map(date => (
                                    OPTIONS.map(opt => (
                                        <th key={'cap-' + date + opt} className="border border-gray-300 p-0 h-6">
                                            <select
                                                className="w-full h-full p-0 text-[10px] text-center border-none focus:ring-0 bg-transparent font-bold text-gray-700 appearance-none cursor-pointer hover:bg-gray-50 dark:bg-transparent"
                                                value={getShiftCaptain(date, opt)}
                                                onChange={(e) => handleShiftCaptainChange(date, opt, e.target.value)}
                                            >
                                                <option value="" className="text-gray-300">-</option>
                                                {captains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </th>
                                    ))
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {crew.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 h-8">
                                    <td className="p-1 border font-bold text-gray-800 bg-white sticky left-0 z-20 text-center shadow-md truncate">
                                        {c.name}
                                    </td>
                                    {weekDates.map(date => (
                                        OPTIONS.map(opt => {
                                            const role = getScheduleRole(c.id, date, opt);
                                            let cellClass = "bg-white";
                                            let text = "";
                                            if (role === 'CREW') { cellClass = "bg-blue-100 text-blue-800"; text = "CREW"; }
                                            else if (role === 'MC') { cellClass = "bg-yellow-100 text-yellow-800"; text = "MC"; }

                                            return (
                                                <td
                                                    key={'cell-' + c.id + date + opt}
                                                    className={`border p-0 text-center cursor-pointer transition-colors hover:opacity-80 ${cellClass}`}
                                                    onClick={() => toggleSchedule(c.id, date, opt)}
                                                >
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-[10px] select-none">{text}</div>
                                                </td>
                                            );
                                        })
                                    ))}
                                </tr>
                            ))}
                            {crew.length === 0 && (
                                <tr><td colSpan={22} className="p-4 text-center text-gray-400">등록된 크루가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
