import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Reservation } from "@/types/reservation";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// "2명" -> 2
export function parsePax(paxStr: string | undefined): number {
    if (!paxStr) return 0;
    const num = parseInt(paxStr.toString().replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

export function calculateTotalPax(items: Reservation[]): number {
    return items.reduce((sum, item) => {
        if (item.status === "취소") return sum;
        return sum + parsePax(item.pax);
    }, 0);
}
// Haversine formula to calculate the distance between two coordinates in kilometers or meters
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (value: number) => (value * Math.PI) / 180;

    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceInMeters = R * c;
    return distanceInMeters;
}

export interface PickupLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    time_1: string | null;
    time_2: string | null;
    time_3: string | null;
}

// Find closest pickup location
export function findClosestPickup(
    userLat: number,
    userLng: number,
    locations: PickupLocation[]
): { closestLocation: PickupLocation; distanceMeters: number } | null {
    if (locations.length === 0) return null;

    let closestLocation = locations[0];
    let minDistance = calculateDistance(userLat, userLng, closestLocation.lat, closestLocation.lng);

    for (let i = 1; i < locations.length; i++) {
        const loc = locations[i];
        const distance = calculateDistance(userLat, userLng, loc.lat, loc.lng);
        if (distance < minDistance) {
            closestLocation = loc;
            minDistance = distance;
        }
    }

    return { closestLocation, distanceMeters: minDistance };
}

// Helper to convert meters to walking minutes approx (average walking speed 5km/h ~ 83m/min)
export function getWalkingMinutes(meters: number): number {
    return Math.ceil(meters / 83);
}

export interface SplitGroup {
    name: string;
    pickup: string;
    pax: number;
}

/**
 * Detect multi-pickup patterns in pickup_location.
 * Supported: "장소 N명 (이름), 장소 N명 (이름)"
 *       or: "이름,장소,인원,이름,장소,인원"
 */
export function parseSplitPickup(loc: string | null): SplitGroup[] | null {
    if (!loc) return null;
    const trimmed = loc.trim();

    // Pattern: "장소 N명 (이름), 장소 N명 (이름)"
    const descRegex = /([^\s,]+)\s+(\d+)\s*명\s*\(([^)]+)\)/g;
    const groups: SplitGroup[] = [];
    let m: RegExpExecArray | null;
    while ((m = descRegex.exec(trimmed)) !== null) {
        groups.push({ pickup: m[1], pax: parseInt(m[2], 10), name: m[3].trim() });
    }
    if (groups.length >= 2) return groups;

    // Pattern: "이름,장소,인원,이름,장소,인원"
    const parts = trimmed.split(',').map(s => s.trim());
    if (parts.length >= 6 && parts.length % 3 === 0) {
        const csvGroups: SplitGroup[] = [];
        let valid = true;
        for (let i = 0; i < parts.length; i += 3) {
            const pax = parseInt(parts[i + 2], 10);
            if (!parts[i] || !parts[i + 1] || isNaN(pax)) { valid = false; break; }
            csvGroups.push({ name: parts[i], pickup: parts[i + 1], pax });
        }
        if (valid && csvGroups.length >= 2) return csvGroups;
    }

    return null;
}
