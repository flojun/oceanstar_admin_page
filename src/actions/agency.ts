"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { ReservationInsert, ReservationUpdate } from "@/types/reservation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "oceanstar-agency-super-secret-key-change-in-prod";

// Helper to get supabase client on demand instead of at build time
const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
    return createClient(supabaseUrl, supabaseKey);
};

export async function loginAgency(login_id: string, password_input: string) {
    try {
        const supabase = getSupabase();
        const { data: agency, error } = await supabase
            .from("agencies")
            .select("id, password, name")
            .eq("login_id", login_id)
            .single();

        if (error || !agency) {
            return { success: false, error: "존재하지 않는 아이디입니다." };
        }

        // Use bcrypt for secure password comparison
        const isMatch = await bcrypt.compare(password_input, agency.password);
        if (!isMatch) {
            return { success: false, error: "비밀번호가 일치하지 않습니다." };
        }

        const c = await cookies();

        // Create JWT payload
        const token = jwt.sign(
            { id: agency.id, name: agency.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        c.set("agency_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // Also store agency name in a separate plain cookie for UI (optional, but convenient)
        c.set("agency_name", agency.name, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return { success: true };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: "로그인 처리 중 오류 발생" };
    }
}

export async function logoutAgency() {
    const c = await cookies();
    c.delete("agency_session");
    c.delete("agency_name");
    return { success: true };
}

export async function getAgencySession() {
    const c = await cookies();
    const token = c.get("agency_session")?.value;

    if (!token) return { id: undefined, name: undefined };

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string };
        return { id: decoded.id, name: decoded.name };
    } catch (err) {
        // Token is invalid or expired
        return { id: undefined, name: undefined };
    }
}

// Helper: Check if adding additionalPax to a specific date/option exceeds the max capacity of 35.
async function checkCapacity(tourDate: string, option: string, additionalPax: number, excludeId?: string): Promise<string | null> {
    if (!tourDate || !option) return null;

    const supabase = getSupabase();
    let query = supabase
        .from("reservations")
        .select("pax")
        .eq("tour_date", tourDate)
        .eq("option", option)
        .not("status", "in", '("취소","취소요청")');

    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Capacity check error:", error);
        return "예약 상태를 확인할 수 없습니다.";
    }

    let currentPax = 0;
    if (data) {
        for (const row of data) {
            if (row.pax) {
                const match = row.pax.match(/\d+/);
                if (match) currentPax += parseInt(match[0], 10);
            }
        }
    }

    if (currentPax + additionalPax > 35) {
        return `선택하신 날짜와 시간은 인원이 마감되어 예약할 수 없습니다. (현재 잔여: ${Math.max(0, 35 - currentPax)}명)`;
    }

    return null;
}

export async function createAgencyReservation(reservation: ReservationInsert) {
    const session = await getAgencySession();
    if (!session.id) return { success: false, error: "Unauthorized" };

    try {
        // Validation: Capacity Check
        let newPaxNum = 0;
        const paxStr = reservation.pax || "0";
        const m = paxStr.match(/\d+/);
        if (m) newPaxNum = parseInt(m[0], 10);

        const capError = await checkCapacity(reservation.tour_date, reservation.option, newPaxNum);
        if (capError) return { success: false, error: capError };

        const supabase = getSupabase();
        // 1. Insert reservation
        const { data, error } = await supabase
            .from("reservations")
            .insert({
                ...reservation,
                agency_id: session.id,
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Insert notification for Admin
        await supabase.from("agency_notifications").insert({
            agency_id: session.id,
            reservation_id: data.id,
            action: "CREATED",
            message: `${session.name}에서 새로운 예약(${reservation.name})을 추가했습니다.`,
        });

        return { success: true, data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

export async function updateAgencyReservation(id: string, updates: ReservationUpdate) {
    const session = await getAgencySession();
    if (!session.id) return { success: false, error: "Unauthorized" };

    try {
        const supabase = getSupabase();
        // Validation: Check capacity if date, option, or pax changed
        if (updates.tour_date || updates.option || updates.pax) {
            // Need to know existing details first
            const { data: existing, error: existErr } = await supabase
                .from("reservations")
                .select("id, pax, tour_date, option")
                .eq("id", id)
                .single();

            if (existErr) throw existErr;

            const newTourDate = updates.tour_date || existing.tour_date;
            const newOption = updates.option || existing.option;
            const newPaxStr = updates.pax || existing.pax || "0";

            const dateChanged = updates.tour_date && updates.tour_date !== existing.tour_date;
            const optionChanged = updates.option && updates.option !== existing.option;
            const paxChanged = updates.pax && updates.pax !== existing.pax;

            if (dateChanged || optionChanged || paxChanged) {
                let newPaxNum = 0;
                const m = newPaxStr.match(/\d+/);
                if (m) newPaxNum = parseInt(m[0], 10);

                const capError = await checkCapacity(newTourDate, newOption, newPaxNum, id);
                if (capError) return { success: false, error: capError };
            }
        }

        const { data, error } = await supabase
            .from("reservations")
            .update(updates)
            .eq("id", id)
            .eq("agency_id", session.id) // Ensure they only edit their own
            .select()
            .single();

        if (error) throw error;

        await supabase.from("agency_notifications").insert({
            agency_id: session.id,
            reservation_id: id,
            action: "UPDATED",
            message: `${session.name}에서 예약(${updates.name || '알수없음'})을 변경했습니다.`,
        });

        return { success: true, data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

export async function cancelAgencyReservation(id: string, reserverName: string) {
    const session = await getAgencySession();
    if (!session.id) return { success: false, error: "Unauthorized" };

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("reservations")
            .update({ status: "취소요청" })
            .eq("id", id)
            .eq("agency_id", session.id)
            .select()
            .single();

        if (error) throw error;

        await supabase.from("agency_notifications").insert({
            agency_id: session.id,
            reservation_id: id,
            action: "CANCELLED",
            message: `${session.name}에서 예약(${reserverName})의 취소를 요청했습니다.`,
        });

        return { success: true, data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

export async function getAgencyAvailabilityWeekly(startDate: string, endDate: string) {
    const session = await getAgencySession();
    if (!session.id) return { success: false, error: "Unauthorized" };

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("reservations")
            .select("option, pax, status, tour_date")
            .gte("tour_date", startDate)
            .lte("tour_date", endDate)
            .not("status", "in", '("취소","취소요청")');

        if (error) throw error;

        // Create an array of all dates between startDate and endDate
        const results = [];
        // Parse as local noon to avoid UTC midnight causing day shift (e.g. in UTC-10)
        const curr = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');

        // Local date formatter helper
        const fmtDate = (dt: Date) => {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const d = String(dt.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        while (curr <= end) {
            const dateStr = fmtDate(curr);
            const dayOfWeek = curr.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
            const isSunday = dayOfWeek === 0;

            // Default open slots
            const slots: Record<string, number> = {
                "1부": 0,
                "2부": 0,
            };

            // 3부 is open Tue, Wed, Thu (2, 3, 4)
            if (dayOfWeek >= 2 && dayOfWeek <= 4) {
                slots["3부"] = 0;
            }

            // Filter reservations for this specific date
            const daysData = data?.filter((r: any) => r.tour_date === dateStr) || [];

            // Tally pax
            if (daysData.length > 0) {
                for (const row of daysData) {
                    if (!row.option) continue;

                    // If it's a 3부 booking on an exceptional day, open the slot
                    if (row.option === "3부" && slots["3부"] === undefined) {
                        slots["3부"] = 0;
                    }

                    if (slots[row.option] !== undefined) {
                        let paxNum = 0;
                        if (row.pax) {
                            const match = row.pax.match(/\d+/);
                            if (match) {
                                paxNum = parseInt(match[0], 10);
                            }
                        }
                        slots[row.option] += paxNum;
                    }
                }
            }

            // Calculate statuses
            const availability = Object.keys(slots).map(option => {
                const currentPax = slots[option];
                let statusText = "출발 미정";

                if (currentPax <= 10) statusText = "출발 미정";
                else if (currentPax <= 31) statusText = "예약 가능";
                else if (currentPax <= 35) statusText = "마감 임박";
                else statusText = "마감";

                return {
                    option,
                    status: statusText
                };
            });

            // For Sunday: only include if there are actual bookings
            const hasSundayBookings = isSunday && daysData.length > 0;
            if (isSunday && !hasSundayBookings) {
                curr.setDate(curr.getDate() + 1);
                continue;
            }

            // Sort: 1부, 2부, 3부, etc.
            availability.sort((a, b) => a.option.localeCompare(b.option));

            results.push({
                date: dateStr,
                availability
            });

            // Increment day
            curr.setDate(curr.getDate() + 1);
        }

        return { success: true, data: results };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}
