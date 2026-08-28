-- 환불 기능용 컬럼. Supabase 대시보드 SQL Editor에 붙여넣어 실행한다.
--
-- payment_intent_id     Stripe 결제 번호. 없으면 환불 자체가 불가능하다.
-- captured_at           캡처된 시각. NULL이면 승인만 된 상태(수수료 없이 취소 가능).
-- refunded_amount       누적 환불 총액.
-- cancel_requested_at   손님이 취소를 요청한 시각. 예약 후 24시간 이내 요청 판단용.

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz;

-- 캡처 크론이 매일 훑는 조건.
CREATE INDEX IF NOT EXISTS reservations_pending_capture_idx
  ON reservations (payment_intent_id) WHERE captured_at IS NULL;

-- 환불 API가 order_id로 예약을 찾는다(콤보는 1결제 2행).
CREATE INDEX IF NOT EXISTS reservations_order_id_idx
  ON reservations (order_id);
