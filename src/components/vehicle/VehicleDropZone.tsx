import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Vehicle, Driver } from '@/types/vehicle';
import { Reservation } from '@/types/reservation';
import { DraggableBar } from './DraggableBar';

interface VehicleDropZoneProps {
    vehicle: Vehicle;
    drivers: Driver[];
    onDriverChange: (vehicleId: string, driverId: string) => void;
    items: Reservation[];
    driverId: string | null;
    optionName?: string;
    dateTitle?: string;
}

export function VehicleDropZone({ vehicle, drivers, onDriverChange, optionName, dateTitle }: VehicleDropZoneProps) {
    const { setNodeRef } = useDroppable({
        id: vehicle.id,
    });

    const totalPax = vehicle.items.reduce((sum, item) => sum + Number(item.pax?.replace(/[^0-9]/g, '') || 0), 0);
    const isOverLimit = vehicle.type === 'company' && totalPax > 15;

    const sortableItems = useMemo(() => vehicle.items.map(i => i.id), [vehicle.items]);

    return (
        <div className="w-full h-auto bg-white rounded-lg border border-gray-200 flex flex-col shadow-sm">
            {/* Export Date Title (Only visible when provided, mainly for export) */}
            {dateTitle && (
                <div className="bg-gray-800 text-white text-center py-1 text-sm font-bold rounded-t-lg">
                    {dateTitle}
                </div>
            )}
            {/* Header */}
            <div className="p-3 border-b bg-white rounded-t-lg">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-gray-800">
                        {vehicle.name} {optionName && <span className="text-sm font-normal text-gray-500">({optionName})</span>}
                    </h3>
                    <span className={`text-sm font-bold px-2 py-1 rounded ${isOverLimit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        {totalPax} / {vehicle.maxPax}명
                    </span>
                </div>

                {/* Driver Selector */}
                <select
                    value={vehicle.driverId || ""}
                    onChange={(e) => onDriverChange(vehicle.id, e.target.value)}
                    className="w-full text-sm border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="">기사님 선택</option>
                    {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            {/* Drop Area - Standard Block that grows with content */}
            <div ref={setNodeRef} className="p-2 min-h-[200px] vehicle-drop-area">
                <SortableContext
                    items={sortableItems}
                    strategy={verticalListSortingStrategy}
                >
                    {vehicle.items.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded">
                            여기로 드래그하세요
                        </div>
                    ) : (
                        vehicle.items.map((item, index) => (
                            <DraggableBar key={item.id} reservation={item} index={index} />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
