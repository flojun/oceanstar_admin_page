-- 1. reservations 테이블에 컬럼 추가 (차량 배정 정보)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS vehicle_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vehicle_order integer DEFAULT 999;

-- 2. daily_vehicle_status 테이블 생성 (기사님 배정 정보)
CREATE TABLE IF NOT EXISTS daily_vehicle_status (
    date date NOT NULL,
    option text NOT NULL,
    vehicle_id text NOT NULL,
    driver_id uuid REFERENCES drivers(id),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (date, option, vehicle_id)
);

-- RLS (보안) 설정
ALTER TABLE daily_vehicle_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON daily_vehicle_status FOR ALL USING (true) WITH CHECK (true);
