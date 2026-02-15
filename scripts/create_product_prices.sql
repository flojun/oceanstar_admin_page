-- ==========================================================
-- product_prices: 정산 기준가 관리 테이블
-- ==========================================================

CREATE TABLE IF NOT EXISTS product_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,                  -- 상품 표시명
  match_keywords TEXT NOT NULL DEFAULT '',      -- 쉼표 구분 매칭 키워드
  adult_price INTEGER NOT NULL DEFAULT 0,      -- 성인 정산 기준가 (KRW)
  child_price INTEGER NOT NULL DEFAULT 0,      -- 아동 정산 기준가 (KRW)
  tier_group TEXT NOT NULL DEFAULT 'Tier 1',   -- 가격 등급
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON product_prices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated manage" ON product_prices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Data: 7 상품 (단품 4 + 콤보 3)
INSERT INTO product_prices (product_name, match_keywords, adult_price, child_price, tier_group) VALUES
  -- Tier 1: 단품 스노클링
  ('거북이 스노클링(1/2부)', '1부,2부',                     175000, 150000, 'Tier 1'),
  -- Tier 2: 단품 선셋 / 단품 액티비티
  ('선셋 스노클링(3부)',     '3부,선셋',                    235000, 200000, 'Tier 2'),
  ('패러세일링(단품)',       '패러,단품패러',                200000, 180000, 'Tier 2'),
  ('제트스키(단품)',         '제트,단품제트',                200000, 180000, 'Tier 2'),
  -- Tier 3: 콤보 상품
  ('[콤보] 거북이 + 패러',   '1부+패러,2부+패러',           350000, 320000, 'Tier 3'),
  ('[콤보] 거북이 + 제트',   '1부+제트,2부+제트',           350000, 320000, 'Tier 3'),
  ('[액티비티] 패러 + 제트', '패러+제트',                    300000, 280000, 'Tier 3')
ON CONFLICT DO NOTHING;
