-- 기존 테이블과 정책이 있다면 먼저 삭제합니다 (깔끔한 재구성을 위해)
DROP TABLE IF EXISTS invoice_prices;

-- Create invoice_prices table (새로운 스키마: 성인/아동 분리)
CREATE TABLE invoice_prices (
  source VARCHAR(255) PRIMARY KEY,
  price_regular_adult NUMERIC(10, 2),
  price_regular_child NUMERIC(10, 2),
  price_sunset_adult NUMERIC(10, 2),
  price_sunset_child NUMERIC(10, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE invoice_prices IS 'Manage USD unit prices (Regular Adult/Child vs Sunset Adult/Child) per agency/source for invoices';

-- Create policy to allow access
ALTER TABLE invoice_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON invoice_prices FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON invoice_prices FOR ALL USING (auth.role() = 'authenticated');
