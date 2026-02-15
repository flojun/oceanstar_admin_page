import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Reservation } from '@/types/reservation';

interface DraggableBarProps {
    reservation: Reservation;
    index: number;
}

export function DraggableBar({ reservation, index }: DraggableBarProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: reservation.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center gap-2 p-2 mb-2 bg-white border border-gray-200 rounded shadow-sm cursor-grab active:cursor-grabbing hover:bg-blue-50 text-sm touch-none select-none ${isDragging ? 'z-50 ring-2 ring-blue-500' : ''}`}
        >
            <div className="w-20 font-bold text-gray-800 truncate" title={reservation.pickup_location}>
                {reservation.pickup_location}
            </div>
            <div className="w-16 font-semibold text-gray-900 truncate" title={reservation.name}>
                {reservation.name}
            </div>
            <div className="w-10 text-center bg-blue-100 text-blue-700 rounded px-1 font-bold text-xs py-0.5">
                {reservation.pax?.replace(/명/g, '')}명
            </div>
            <div className="flex-1 text-right text-gray-500 text-xs truncate">
                {reservation.contact}
            </div>
        </div>
    );
}
