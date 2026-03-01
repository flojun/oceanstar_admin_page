"use server";

import { createClient } from "@supabase/supabase-js";
import { Agency } from "@/types/agency";
import bcrypt from "bcryptjs";

// Ensure this uses the service role key to bypass the new restrictive RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAgencies() {
    try {
        const { data, error } = await supabase
            .from("agencies")
            .select("id, name, login_id, created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, data: data as Agency[] };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

export async function createAgency(agencyData: { name: string; login_id: string; password?: string }) {
    try {
        let finalPassword = agencyData.password;

        // Hash password before inserting
        if (finalPassword) {
            finalPassword = await bcrypt.hash(finalPassword, 10);
        }

        const { data, error } = await supabase.from("agencies").insert({
            name: agencyData.name,
            login_id: agencyData.login_id,
            password: finalPassword
        }).select().single();

        if (error) {
            if (error.code === '23505') return { success: false, error: "이미 존재하는 아이디입니다.", code: error.code };
            throw error;
        }

        return { success: true, data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

export async function updateAgency(id: string, updates: { name?: string; login_id?: string; password?: string }) {
    try {
        const payload: any = { ...updates };

        // Hash password if provided in the update payload
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10);
        }

        const { data, error } = await supabase.from("agencies").update(payload).eq('id', id).select().single();

        if (error) {
            if (error.code === '23505') return { success: false, error: "이미 존재하는 아이디입니다.", code: error.code };
            throw error;
        }

        return { success: true, data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

export async function deleteAgency(id: string) {
    try {
        const { error } = await supabase.from("agencies").delete().eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message };
    }
}
