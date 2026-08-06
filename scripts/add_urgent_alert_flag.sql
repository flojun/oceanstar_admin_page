-- 긴급 예약 알림 중복 발송 방지용 플래그
-- Discord 알림이 이미 발송된 예약에 대해 재발송하지 않도록 함
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS urgent_alert_sent boolean DEFAULT false;
