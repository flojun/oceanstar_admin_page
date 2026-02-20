-- ================================
-- crew_attendance_setup.sql
-- Run this in Supabase SQL Editor
-- ================================

-- 1. crew_members에 pin 컬럼 추가
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS pin text;

-- 2. captains에 pin 컬럼 추가
ALTER TABLE captains ADD COLUMN IF NOT EXISTS pin text;

-- 3. crew_attendance 테이블 생성
CREATE TABLE IF NOT EXISTS crew_attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    crew_id uuid REFERENCES crew_members(id) ON DELETE CASCADE,
    date date NOT NULL,
    option text NOT NULL CHECK (option IN ('1부', '2부', '3부')),
    checked_in_at timestamptz DEFAULT now(),
    UNIQUE (crew_id, date, option)
);

-- 4. captain_attendance 테이블 생성
CREATE TABLE IF NOT EXISTS captain_attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    captain_id uuid REFERENCES captains(id) ON DELETE CASCADE,
    date date NOT NULL,
    option text NOT NULL CHECK (option IN ('1부', '2부', '3부')),
    checked_in_at timestamptz DEFAULT now(),
    UNIQUE (captain_id, date, option)
);

-- 5. RLS 설정 (crew_attendance)
ALTER TABLE crew_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_insert" ON crew_attendance;
DROP POLICY IF EXISTS "attendance_select" ON crew_attendance;
CREATE POLICY "attendance_insert" ON crew_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "attendance_select" ON crew_attendance FOR SELECT USING (true);

-- 6. RLS 설정 (captain_attendance)
ALTER TABLE captain_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "captain_attendance_insert" ON captain_attendance;
DROP POLICY IF EXISTS "captain_attendance_select" ON captain_attendance;
CREATE POLICY "captain_attendance_insert" ON captain_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "captain_attendance_select" ON captain_attendance FOR SELECT USING (true);
