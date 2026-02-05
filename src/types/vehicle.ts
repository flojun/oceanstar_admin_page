import { Reservation } from "@/types/reservation";

export interface Driver {
    id: string;
    name: string;
    created_at?: string;
}

export interface Vehicle {
    id: string; // e.g., 'vehicle-1', 'vehicle-2', 'personal-1'
    name: string; // Display name e.g. "1호차"
    type: 'company' | 'personal';
    maxPax: number;
    driverId: string | null; // Id of assigned driver
    items: Reservation[]; // Assigned reservations
}

export type VehicleState = {
    [key: string]: Vehicle;
};

export interface DropZoneProps {
    id: string;
    vehicle: Vehicle;
    drivers: Driver[];
    onDriverChange: (vehicleId: string, driverId: string) => void;
    children: React.ReactNode;
}
