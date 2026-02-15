"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { supabase } from '@/lib/supabase';
import { Reservation } from '@/types/reservation';
import { calculateTotalPax, cn } from '@/lib/utils';
import { getHawaiiTomorrowStr, getKoreanDay } from '@/lib/timeUtils';
import { Vehicle, Driver, VehicleState } from '@/types/vehicle';
import { VehicleDropZone } from '@/components/vehicle/VehicleDropZone';
import { DraggableBar } from '@/components/vehicle/DraggableBar';
import { VehicleManifestTable } from '@/components/vehicle/VehicleManifestTable';

// ... (imports remain)
import { DriverManager } from '@/components/vehicle/DriverManager';
import { DatePicker } from '@/components/ui/DatePicker';
import { toPng } from 'html-to-image';
import { Download, Copy, Share2 } from 'lucide-react';

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

const PICKUP_TIMES: Record<string, string> = {
    "프린스": "07:50",
    "카할라": "07:10",
    "카라이": "07:45",
    "일리카이": "07:45",
    "HGI": "07:30",
    "알모": "07:50",
    "소화전": "07:30",
    "직접": "07:50",
    "QK": "07:20",
    "IHOP": "07:45",
    "HP": "07:20",
    "모나크": "07:45",
    "HM": "07:40",
    "마루": "07:30",
    "코트야드": "07:40",
    "코트": "07:40",
    "WR": "07:30",
    "HV(할레)": "07:45",
    "HIE": "07:45",
    "리츠": "07:45",
    "Azure": "07:50",
    "SKY": "07:50",
    "KOA": "07:30",
    "녹색": "07:30",
    "녹색천막": "07:30",
};

const getPickupSortKey = (location: string | null) => {
    if (!location) return "99:99"; // End of list
    // Try exact match
    if (PICKUP_TIMES[location]) return PICKUP_TIMES[location];

    // Check if location starts with known key (handling potential variations)
    const knownKey = Object.keys(PICKUP_TIMES).find(key => location.includes(key));
    return knownKey ? PICKUP_TIMES[knownKey] : "99:99";
};

// Initial Vehicle State structure - defined outside component to maintain stable reference
const initialVehiclesState: VehicleState = {
    "unassigned": { id: "unassigned", name: "미배정 명단", type: "company", maxPax: 999, driverId: null, items: [] },
    "vehicle-1": { id: "vehicle-1", name: "1호차", type: "company", maxPax: 15, driverId: null, items: [] },
    "vehicle-2": { id: "vehicle-2", name: "2호차", type: "company", maxPax: 15, driverId: null, items: [] },
    "vehicle-3": { id: "vehicle-3", name: "3호차", type: "company", maxPax: 15, driverId: null, items: [] },
    "personal-1": { id: "personal-1", name: "개인차량", type: "personal", maxPax: 999, driverId: null, items: [] },
};

function createFreshVehicleState(): VehicleState {
    return JSON.parse(JSON.stringify(initialVehiclesState));
}

export default function VehiclePage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string>("1부");
    const [selectedDate, setSelectedDate] = useState<string>(getHawaiiTomorrowStr());
    const [activeId, setActiveId] = useState<string | null>(null);

    const [vehicles, setVehicles] = useState<VehicleState>(createFreshVehicleState);
    const [bulkData, setBulkData] = useState<Record<string, VehicleState>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );




    // Fetch Drivers
    const fetchDrivers = async () => {
        const { data } = await supabase.from('drivers').select('*').order('created_at');
        if (data) setDrivers(data);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // A. Fetch Reservations for Date/Option
            const { data: resData, error: resError } = await supabase
                .from("reservations")
                .select("*")
                .eq("tour_date", selectedDate)
                .eq("option", selectedOption)
                .neq("status", "취소");

            if (resError) throw resError;

            // B. Fetch Driver Assignments from daily_vehicle_status
            const { data: statusData, error: statusError } = await supabase
                .from("daily_vehicle_status")
                .select("*")
                .eq("date", selectedDate)
                .eq("option", selectedOption);

            if (statusError) throw statusError;

            // C. Construct State
            const state = createFreshVehicleState();

            // Apply Driver Assignments
            if (statusData) {
                statusData.forEach((status: any) => {
                    if (state[status.vehicle_id]) {
                        state[status.vehicle_id].driverId = status.driver_id;
                    }
                });
            }

            // Distribute Reservations
            const unassignedItems: Reservation[] = [];

            (resData || []).forEach((res: Reservation) => {
                const vId = res.vehicle_id || 'unassigned';
                if (state[vId]) {
                    state[vId].items.push(res);
                } else {
                    unassignedItems.push(res);
                }
            });

            // Sort items in each vehicle
            Object.keys(state).forEach(key => {
                if (key === 'unassigned') {
                    state[key].items.sort((a: Reservation, b: Reservation) => {
                        if (a.vehicle_order !== undefined && b.vehicle_order !== undefined && a.vehicle_order !== 999 && b.vehicle_order !== 999) {
                            return a.vehicle_order - b.vehicle_order;
                        }
                        const timeA = getPickupSortKey(a.pickup_location);
                        const timeB = getPickupSortKey(b.pickup_location);
                        if (timeA !== timeB) return timeA.localeCompare(timeB);
                        return (a.pickup_location || "").localeCompare(b.pickup_location || "");
                    });
                } else {
                    state[key].items.sort((a: Reservation, b: Reservation) => (a.vehicle_order || 999) - (b.vehicle_order || 999));
                }
            });

            // Add any invalid-vehicle items to unassigned
            if (unassignedItems.length > 0) {
                state.unassigned.items.push(...unassignedItems);
            }

            setVehicles(state);

        } catch (error) {
            console.error("Error fetching vehicle data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, selectedOption]);

    useEffect(() => {
        fetchData();
        fetchDrivers();
    }, [fetchData]);


    // Save Driver Assignment
    const handleDriverChange = useCallback(async (vehicleId: string, driverId: string) => {
        // Optimistic UI Update
        setVehicles(prev => ({
            ...prev,
            [vehicleId]: { ...prev[vehicleId], driverId }
        }));

        try {
            // UPSERT to daily_vehicle_status
            const { error } = await supabase
                .from("daily_vehicle_status")
                .upsert({
                    date: selectedDate,
                    option: selectedOption,
                    vehicle_id: vehicleId,
                    driver_id: driverId || null,
                }, { onConflict: 'date, option, vehicle_id' });

            if (error) throw error;
        } catch (error) {
            console.error("Error saving driver:", error);
            alert("기사 배정 저장 실패");
            fetchData(); // Revert on error
        }
    }, [selectedDate, selectedOption, fetchData]);

    // ... (Handlers)

    // ...

    // Render part update to use memoized callback


    const handleOptionChange = (newOption: string) => {
        if (newOption === selectedOption) return;
        setSelectedOption(newOption);
    };

    const handleDateChange = (newDate: string) => {
        if (newDate === selectedDate) return;
        setSelectedDate(newDate);
    };

    // Actually, fetchAllOptionsData is for export and needs to fetch *all* options.
    // We can refactor it to fetch all 3 options from DB similarly.
    const fetchAllOptionsData = async () => {
        setLoading(true);
        const targetOptions = ['1부', '2부', '3부'];
        const newBulkData: Record<string, VehicleState> = {};

        try {
            // 1. Fetch Reservations
            const { data: allRes, error: resError } = await supabase
                .from("reservations")
                .select("*")
                .eq("tour_date", selectedDate)
                .in("option", targetOptions)
                .neq("status", "취소");
            if (resError) throw resError;

            // 2. Fetch Drivers Status
            const { data: allStatus, error: statusError } = await supabase
                .from("daily_vehicle_status")
                .select("*")
                .eq("date", selectedDate); // Fetch for all options of that date
            if (statusError) throw statusError;

            // 3. Build Data
            targetOptions.forEach(opt => {
                const state = createFreshVehicleState();

                // Drivers
                const optStatus = allStatus?.filter(s => s.option === opt) || [];
                optStatus.forEach((s: any) => {
                    if (state[s.vehicle_id]) state[s.vehicle_id].driverId = s.driver_id;
                });

                // Reservations
                const optRes = allRes?.filter(r => r.option === opt) || [];
                optRes.forEach((res: Reservation) => {
                    const vId = res.vehicle_id || 'unassigned';
                    if (state[vId]) state[vId].items.push(res);
                    else state.unassigned.items.push(res);
                });

                // Sort
                Object.keys(state).forEach(key => {
                    const items = state[key].items;
                    if (key === 'unassigned') {
                        items.sort((a: Reservation, b: Reservation) => {
                            if (a.vehicle_order !== undefined && b.vehicle_order !== undefined && a.vehicle_order !== 999) {
                                return a.vehicle_order - b.vehicle_order;
                            }
                            const timeA = getPickupSortKey(a.pickup_location);
                            const timeB = getPickupSortKey(b.pickup_location);
                            if (timeA !== timeB) return timeA.localeCompare(timeB);
                            return (a.pickup_location || "").localeCompare(b.pickup_location || "");
                        });
                    } else {
                        items.sort((a: Reservation, b: Reservation) => (a.vehicle_order || 999) - (b.vehicle_order || 999));
                    }
                });

                newBulkData[opt] = state;
            });

            setBulkData(newBulkData);
            return newBulkData;

        } catch (error) {
            console.error("Bulk fetch error", error);
            return {};
        } finally {
            setLoading(false);
        }
    };


    // DnD Handlers
    const findContainerInState = (id: string, state: VehicleState): string | undefined => {
        if (id in state) return id;
        return Object.keys(state).find((key) =>
            state[key].items.some((item) => item.id === id)
        );
    };

    const findContainer = (id: string): string | undefined => {
        return findContainerInState(id, vehicles);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        setVehicles((prev) => {
            const activeContainer = findContainerInState(active.id as string, prev);
            const overContainer = (overId as string in prev)
                ? (overId as string)
                : findContainerInState(overId as string, prev);

            if (!activeContainer || !overContainer || activeContainer === overContainer) {
                return prev;
            }

            const activeItems = prev[activeContainer].items;
            const overItems = prev[overContainer].items;
            const activeIndex = activeItems.findIndex((item) => item.id === active.id);

            // Guard: item not found (already moved by a previous event)
            if (activeIndex === -1) return prev;

            const activeItem = activeItems[activeIndex];
            if (!activeItem) return prev;

            let newIndex: number;
            if ((overId as string) in prev) {
                // Dropping onto the container itself → append to end
                newIndex = overItems.length;
            } else {
                const overIndex = overItems.findIndex((item) => item.id === overId);
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
            }

            // Clamp index to valid bounds
            newIndex = Math.max(0, Math.min(newIndex, overItems.length));

            const newActiveItems = activeItems.filter((item) => item.id !== active.id);
            const newOverItems = [
                ...overItems.slice(0, newIndex),
                activeItem,
                ...overItems.slice(newIndex),
            ];

            return {
                ...prev,
                [activeContainer]: {
                    ...prev[activeContainer],
                    items: newActiveItems,
                },
                [overContainer]: {
                    ...prev[overContainer],
                    items: newOverItems,
                },
            };
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);

        if (!over) return;

        // Use functional setState to get fresh state and avoid stale closures
        let updatesForDB: { id: string; vehicle_id: string | null; vehicle_order: number }[] = [];

        setVehicles((prev) => {
            const activeContainer = findContainerInState(active.id as string, prev);
            const overContainer = (over.id as string in prev)
                ? (over.id as string)
                : findContainerInState(over.id as string, prev);

            if (!activeContainer || !overContainer) return prev;

            // Deep clone to avoid mutating state
            const newState: VehicleState = {};
            for (const key of Object.keys(prev)) {
                newState[key] = {
                    ...prev[key],
                    items: [...prev[key].items],
                };
            }

            if (activeContainer === overContainer) {
                // Same container reorder
                const items = newState[activeContainer].items;
                const activeIndex = items.findIndex((item) => item.id === active.id);
                const overIndex = items.findIndex((item) => item.id === over.id);

                if (activeIndex === -1) return prev; // Item not found
                if (overIndex === -1 && !(over.id as string in prev)) return prev;

                const targetIndex = overIndex >= 0 ? overIndex : items.length - 1;

                if (activeIndex !== targetIndex) {
                    newState[activeContainer].items = arrayMove(items, activeIndex, targetIndex);
                }
            } else {
                // Cross-container move
                const sourceItems = newState[activeContainer].items;
                const activeIndex = sourceItems.findIndex((item) => item.id === active.id);

                if (activeIndex === -1) return prev; // Item already moved by dragOver

                const [movedItem] = sourceItems.splice(activeIndex, 1);

                const destItems = newState[overContainer].items;
                let insertIndex: number;

                if ((over.id as string) in prev) {
                    // Dropped on the container itself
                    insertIndex = destItems.length;
                } else {
                    const overIndex = destItems.findIndex((item) => item.id === over.id);
                    insertIndex = overIndex >= 0 ? overIndex : destItems.length;
                }

                // Clamp
                insertIndex = Math.max(0, Math.min(insertIndex, destItems.length));
                destItems.splice(insertIndex, 0, movedItem);
            }

            // Build DB updates from the new state
            const containersToUpdate = Array.from(new Set([activeContainer, overContainer]));
            const updates: { id: string; vehicle_id: string | null; vehicle_order: number }[] = [];

            containersToUpdate.forEach(cId => {
                newState[cId].items.forEach((item, idx) => {
                    updates.push({
                        id: item.id,
                        vehicle_id: cId === 'unassigned' ? null : cId,
                        vehicle_order: idx
                    });
                });
            });

            updatesForDB = updates;
            return newState;
        });

        // Persist to DB (after state update)
        // Use setTimeout to ensure we read the updates captured from the setState callback
        setTimeout(async () => {
            if (updatesForDB.length > 0) {
                try {
                    const { error } = await supabase
                        .from('reservations')
                        .upsert(updatesForDB, { onConflict: 'id' });
                    if (error) {
                        console.error("Error saving drag:", error);
                    }
                } catch (err) {
                    console.error("Error persisting drag changes:", err);
                }
            }
        }, 0);
    };



    // Helper to get active item details for overlay
    const getActiveItem = () => {
        if (!activeId) return null;
        const container = findContainer(activeId);
        if (!container) return null;
        return vehicles[container].items.find(i => i.id === activeId);
    };

    // Export Logic
    const handleDownloadImage = async () => {
        // Target the NEW hidden table container for current option
        const element = document.getElementById(`export-container-current`);
        if (!element) return;

        try {
            const dataUrl = await toPng(element, { cacheBust: true, backgroundColor: '#000000' }); // Black background
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `vehicle-list-${selectedOption}.png`;
            link.click();
        } catch (err) {
            console.error("Export failed", err);
            alert("이미지 저장에 실패했습니다.");
        }
    };

    const handleCopyToClipboard = async () => {
        // Format text as "Vehicle Name: \n - Pickup (Name/Pax) \n ..."
        let text = `[${selectedOption} 배차 명단]\n\n`;

        // Defined order
        const exportOrder = ['vehicle-1', 'vehicle-2', 'vehicle-3', 'personal-1'];

        exportOrder.forEach(key => {
            const v = vehicles[key];
            if (v.items.length === 0) return;

            const driverName = v.driverId ? drivers.find(d => d.id === v.driverId)?.name : "미지정";
            text += `🔹 ${v.name} (${driverName})\n`;
            v.items.forEach(item => {
                text += `  ${item.pickup_location} | ${item.name} | ${item.pax?.replace("명", "")}명 | ${item.contact}\n`;
            });
            text += '\n';
        });

        const unassigned = vehicles['unassigned'];
        if (unassigned.items.length > 0) {
            text += `Please Note: 미배정 ${unassigned.items.length}팀 있음\n`;
        }

        try {
            await navigator.clipboard.writeText(text);
            alert("클립보드에 복사되었습니다. (카카오톡 붙여넣기)");
        } catch (err) {
            alert("복사 실패");
        }
    };

    const handleKakaoShare = async () => {
        const data = await fetchAllOptionsData();
        // Wait for state update and render
        await new Promise(resolve => setTimeout(resolve, 500));

        const files: File[] = [];
        const options = ['1부', '2부', '3부'];

        for (const opt of options) {
            // Check if this option has any assigned vehicles
            const vehicleState = data[opt];
            if (!vehicleState) continue;

            const hasAssignments = ['vehicle-1', 'vehicle-2', 'vehicle-3', 'personal-1'].some(key =>
                vehicleState[key]?.items.length > 0
            );

            if (!hasAssignments) {
                console.log(`Skipping ${opt}: No assignments`);
                continue;
            }

            // Target the NEW hidden table container for bulk export
            const element = document.getElementById(`export-container-${opt}`);
            if (element) {
                try {
                    const dataUrl = await toPng(element, { cacheBust: true, backgroundColor: '#000000' }); // Black background
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], `${selectedDate}_${opt}_배차명단.png`, { type: 'image/png' });
                    files.push(file);
                } catch (e) {
                    console.error(`Failed to generate image for ${opt}`, e);
                }
            }
        }
        if (files.length === 0) {
            alert("배정된 명단이 없어 공유할 파일이 없습니다.");
            return;
        }

        // Detect Mobile Device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files })) {
            // Mobile: Try system share
            try {
                await navigator.share({
                    files: files,
                    title: `${selectedDate} 차량 배차 명단`,
                    text: `${selectedDate} 차량 배차 명단입니다.`
                });
            } catch (err) {
                console.warn("Mobile share failed", err);
                // Optional: fall back to download or just alert
                alert("공유하기가 취소되었거나 지원되지 않습니다.");
            }
        } else {
            // Desktop: Force Download immediately
            // No alert needed if it's obvious, or a non-blocking notification is better.
            // But user might expect an alert explaining why it's downloading.
            if (confirm(`총 ${files.length}개의 배정된 명단 이미지를 다운로드합니다.\n(다운로드 후 카톡으로 드래그 하세요)`)) {
                files.forEach(file => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(file);
                    link.download = file.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 p-4 gap-4 overflow-y-auto relative">

            {/* Hidden Export Container for Bulk Processing (Share All) */}
            <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
                {Object.entries(bulkData).map(([opt, vState]) => (
                    <div key={opt} id={`export-container-${opt}`}>
                        <VehicleManifestTable
                            vehicles={vState}
                            drivers={drivers}
                            optionName={opt}
                            date={selectedDate}
                        />
                    </div>
                ))}
            </div>

            {/* Hidden Export Container for Single (Download Image) */}
            <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
                <div id="export-container-current">
                    <VehicleManifestTable
                        vehicles={vehicles}
                        drivers={drivers}
                        optionName={selectedOption}
                        date={selectedDate}
                    />
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-10 bg-white p-2 rounded-lg shadow-sm flex items-center gap-2 justify-between lg:justify-end shrink-0">
                {/* Mobile Order: Image, Share | Copy */}
                {/* Desktop Order: Copy, Image, Share */}

                {/* Copy Button */}
                <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1 px-3 py-2 lg:px-6 lg:py-3 bg-yellow-400 text-black rounded text-xs lg:text-base font-bold hover:bg-yellow-500 transition order-3 lg:order-1"
                >
                    <Copy size={14} className="lg:w-5 lg:h-5" />
                    <span className="lg:hidden">복사</span>
                    <span className="hidden lg:inline">텍스트로 복사</span>
                </button>

                <div className="flex gap-2 order-1 lg:order-2">
                    <button
                        onClick={handleDownloadImage}
                        className="flex items-center gap-1 px-3 py-2 lg:px-6 lg:py-3 bg-green-600 text-white rounded text-xs lg:text-base font-bold hover:bg-green-700 transition"
                    >
                        <Download size={14} className="lg:w-5 lg:h-5" />
                        <span className="lg:hidden">저장</span>
                        <span className="hidden lg:inline">이미지 저장</span>
                    </button>
                    <button
                        onClick={handleKakaoShare}
                        className="flex items-center gap-1 px-3 py-2 lg:px-6 lg:py-3 bg-yellow-300 text-black rounded text-xs lg:text-base font-bold hover:bg-yellow-400 transition"
                    >
                        <Share2 size={14} className="lg:w-5 lg:h-5" />
                        <span className="lg:hidden">전체 공유</span>
                        <span className="hidden lg:inline">전체 명단 공유</span>
                    </button>
                </div>
            </div>

            {/* Header Section */}
            <div className="bg-white p-3 rounded-lg shadow-sm shrink-0">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center gap-2">
                        <h1 className="text-lg lg:text-3xl font-bold text-gray-800 whitespace-nowrap">
                            차량 배차 <span className="text-sm lg:text-2xl font-normal lg:font-extrabold text-gray-500 lg:text-gray-800">{getKoreanDay(selectedDate)}</span>
                        </h1>
                        <div className="w-32 lg:w-48">
                            <DatePicker
                                value={selectedDate}
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>

                    {/* Option Dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm lg:text-lg font-bold text-gray-700">시간/옵션:</label>
                        <select
                            value={selectedOption}
                            onChange={(e) => handleOptionChange(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm lg:text-lg font-bold"
                        >
                            {['1부', '2부', '3부', '패러', '제트', '기타'].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>


                <div className="w-full">
                    <DriverManager drivers={drivers} onDriversChange={setDrivers} />
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {/* Main Content Area */}
                {/* Let content expand naturally for scrolling */}
                <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4">

                    {/* Left: Unassigned List */}
                    <div className="shrink-0 lg:w-1/4">
                        <UnassignedDropZone
                            items={vehicles.unassigned.items}
                            id="unassigned"
                            totalPax={calculateTotalPax(vehicles.unassigned.items)}
                        />
                    </div>

                    {/* Right: Vehicle Assignment Area */}
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        <div id="vehicle-export-area" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                            {['vehicle-1', 'vehicle-2', 'vehicle-3', 'personal-1'].map(key => (
                                <VehicleDropZone
                                    key={key}
                                    vehicle={vehicles[key]}
                                    drivers={drivers}
                                    driverId={vehicles[key].driverId}
                                    items={vehicles[key].items}
                                    onDriverChange={handleDriverChange}
                                    optionName={selectedOption}
                                    dateTitle={`${selectedDate} ${getKoreanDay(selectedDate)}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer / Export Actions - Moved to Top */}

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <div className="opacity-90 rotate-2 scale-105">
                            {/* Render simple preview */}
                            {(() => {
                                const item = getActiveItem();
                                if (!item) return null;
                                return (
                                    <div className="bg-white p-2 border shadow-lg rounded w-64 flex gap-2 text-sm font-bold">
                                        <span>{item.pickup_location}</span>
                                        <span>{item.name}</span>
                                        <span>{item.pax?.replace(/명/g, '')}명</span>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>

            </DndContext>
        </div >
    );
}

function UnassignedDropZone({ items, id, totalPax }: { items: Reservation[], id: string, totalPax: number }) {
    const { setNodeRef } = useDroppable({ id });

    // Split items by status
    const confirmedItems = useMemo(() => items.filter(i => i.status === '예약확정'), [items]);
    const pendingItems = useMemo(() => items.filter(i => i.status === '대기' || i.status === '예약대기'), [items]);

    // Only pass items that are actually rendered to SortableContext
    const sortableItemIds = useMemo(() => [...confirmedItems, ...pendingItems].map(i => i.id), [confirmedItems, pendingItems]);

    return (
        <div ref={setNodeRef} className="w-full bg-white rounded-lg shadow-sm border flex flex-col min-h-[250px] lg:min-h-[400px]">
            <div className="p-3 border-b bg-gray-50 rounded-t-lg">
                <h3 className="font-bold text-gray-700">명단 리스트 ({items.length}팀 / {totalPax}명)</h3>
                <p className="text-xs text-gray-500">드래그하여 우측 차량에 배정하세요.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <SortableContext
                    items={sortableItemIds}
                    strategy={verticalListSortingStrategy}
                >
                    {/* Confirmed List */}
                    {confirmedItems.length > 0 ? (
                        confirmedItems.map((item, index) => (
                            <DraggableBar key={item.id} reservation={item} index={index} />
                        ))
                    ) : (
                        <div className="text-center text-gray-400 py-4 text-xs">확정된 명단이 없습니다.</div>
                    )}

                    {/* Pending List Section */}
                    {pendingItems.length > 0 && (
                        <>
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink-0 mx-2 text-red-500 text-xs font-bold">대기중인 명단</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>
                            {pendingItems.map((item, index) => (
                                <DraggableBar key={item.id} reservation={item} index={items.findIndex(i => i.id === item.id)} />
                            ))}
                        </>
                    )}

                    {items.length === 0 && (
                        <div className="text-center text-gray-400 py-10 text-sm">배정할 명단이 없습니다.</div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

// Add CSS for container-scroll if needed or ensure tailwind handles it.
// Default scrollbar styling is nice to have.
