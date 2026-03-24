-- ==============================================================
-- 🌊 Ocean Star 수중 스노클링 통합 예약 시스템 DB 세팅
-- (기존 관리자 reservations 테이블 확장 및 pickup_locations 추가)
-- ==============================================================

-- 1. 새로운 픽업 장소 테이블 생성 (Smart Pickup Finder 용)
CREATE TABLE IF NOT EXISTS pickup_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,        -- 호텔 또는 픽업장소 이름 (예: Ilikai Hotel Flagpole)
  lat double precision NOT NULL,    -- 위도
  lng double precision NOT NULL,    -- 경도
  time_1 time,               -- 1부 픽업시간 (예: '07:30')
  time_2 time,               -- 2부 픽업시간
  time_3 time,               -- 3부(선셋) 픽업시간
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 초기 기초 데이터 주입 (대표적인 하와이 픽업 장소 예시)
INSERT INTO pickup_locations (name, lat, lng, time_1, time_2) VALUES
  ('Ilikai Hotel Flagpole', 21.2842, -157.8388, '07:30', '10:30'),
  ('Sheraton Waikiki (Aloha Landing)', 21.2764, -157.8285, '07:45', '10:45'),
  ('Hyatt Regency Waikiki', 21.2762, -157.8247, '08:00', '11:00')
ON CONFLICT DO NOTHING;


-- 2. 기존 reservations 테이블에 Eximbay 온라인 결제 관련 필수 컬럼 추가
-- 기존에 쓰시던 reservations 테이블이 있다는 전제 하에 ALTER 문으로 컬럼을 투입합니다.
-- (만약 테이블이 아예 없다면 새로 생성하셔야 하지만, 기존 데이터가 있으시므로 호환성을 위해 추가합니다.)

DO $$ 
BEGIN 
    -- 주문 번호 (Eximbay 연동)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='order_id') THEN
        ALTER TABLE reservations ADD COLUMN order_id text UNIQUE;
    END IF;
    
    -- 결제 금액
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='total_price') THEN
        ALTER TABLE reservations ADD COLUMN total_price numeric;
    END IF;

    -- 예약자 이메일 (바우처 전송용)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='booker_email') THEN
        ALTER TABLE reservations ADD COLUMN booker_email text;
    END IF;

    -- 성인/아동 인원 (기존 pax 컬럼과 별도로 정확한 관리를 위해 추가 권장)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='adult_count') THEN
        ALTER TABLE reservations ADD COLUMN adult_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='child_count') THEN
        ALTER TABLE reservations ADD COLUMN child_count int DEFAULT 0;
    END IF;
    
    -- 결제/승인용 외부 IP 확인을 위해 (옵션)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='client_ip') THEN
        ALTER TABLE reservations ADD COLUMN client_ip text;
    END IF;
END $$;


-- =========================================================================
-- [중요 요약] 이제 온라인 결제가 이뤄질 때 다음과 같이 INSERT 및 UPDATE 됩니다!
-- 
-- 1. [결제하기] 누름 (Pending 상태)
-- INSERT INTO reservations (source, name, contact, status, option, created_at, tour_date, pax, order_id, ...) 
-- VALUES ('웹사이트', '홍길동', '010...', '결제대기', '1부', ... )
-- 
-- 2. [가상결제 승인] - Webhook 도달 시
-- UPDATE reservations SET status = '예약확정' WHERE order_id = '~~~~'
-- 
-- 3. [비정상 종료 또는 기타 실패]
-- UPDATE reservations SET status = '결제실패' WHERE order_id = '~~~~'
-- =========================================================================
