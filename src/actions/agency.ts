"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { ReservationInsert, ReservationUpdate } from "@/types/reservation";

// Server action client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use anon key since service key is missing
);

export async function loginAgency(login_id: string, password_input: string) {
    try {
        const { data: agency, error } = await supabase
            .from("agencies")
            .select("id, password, name")
            .eq("login_id", login_id)
            .single();

        if (error || !agency) {
            return { success: false, error: "존재하지 않는 아이디입니다." };
        }

        // In a real prod environment, use bcrypt instead of plain text password.
        if (agency.password !== password_input) {
            return { success: false, error: "비밀번호가 일치하지 않습니다." };
        }

        const c = await cookies();
        c.set("agency_session", agency.id, {
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
    const id = c.get("agency_session")?.value;
    const name = c.get("agency_name")?.value;
    return { id, name };
}

export async function createAgencyReservation(reservation: ReservationInsert) {
    const session = await getAgencySession();
    if (!session.id) return { success: false, error: "Unauthorized" };

    try {
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
