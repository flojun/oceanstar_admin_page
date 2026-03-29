-- =============================================
-- 오션스타 동적 투어 시스템 마이그레이션
-- =============================================

-- 1. 새 컬럼 추가
ALTER TABLE tour_settings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE tour_settings ADD COLUMN IF NOT EXISTS start_time VARCHAR DEFAULT '';
ALTER TABLE tour_settings ADD COLUMN IF NOT EXISTS end_time VARCHAR DEFAULT '';
ALTER TABLE tour_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tour_settings ADD COLUMN IF NOT EXISTS is_flat_rate BOOLEAN DEFAULT false;
ALTER TABLE tour_settings ADD COLUMN IF NOT EXISTS vessel_name VARCHAR DEFAULT '오션스타';
ALTER TABLE tour_settings ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. 기존 행에 시간 및 정렬 순서 채우기
UPDATE tour_settings SET start_time = '08:00', end_time = '11:00', display_order = 1 WHERE tour_id = 'morning1';
UPDATE tour_settings SET start_time = '11:00', end_time = '14:00', display_order = 2 WHERE tour_id = 'morning2';
UPDATE tour_settings SET start_time = '15:00', end_time = '18:00', display_order = 3 WHERE tour_id = 'sunset';

-- 3. 프라이빗 차터 행 추가 (이미 존재하면 무시)
INSERT INTO tour_settings (tour_id, name, description, start_time, end_time, adult_price_usd, child_price_usd, adult_price_krw, child_price_krw, max_capacity, blocked_days, is_flat_rate, vessel_name, display_order)
VALUES ('private', '프라이빗 차터', '단독 대관 (2시간 이용)', '', '', 0, 0, 0, 0, 30, '{}', true, '오션스타', 99)
ON CONFLICT (tour_id) DO NOTHING;
