// Haversine formula to calculate the distance between two coordinates in kilometers or meters
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (value: number) => (value * Math.PI) / 180;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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
