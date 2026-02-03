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
