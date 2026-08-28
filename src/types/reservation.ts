export type ReservationStatus = '예약확정' | '취소' | '대기' | '취소요청' | '예약대기' | string;

export interface Reservation {
  id: string;
  created_at: string;
  is_reconfirmed?: boolean; // New Checkbox
  is_admin_checked?: boolean; // Admin acknowledged this reservation
  status: ReservationStatus;
  order_id?: string;
  receipt_date: string; // YYYY-MM-DD
  source: string;
  name: string;
  tour_date: string; // YYYY-MM-DD
  pax: string;
  option: string;
  pickup_location: string;
  contact: string;
  booker_email?: string;
  note: string;
  // Settlement fields
  settlement_status?: 'completed' | 'excluded' | null;
  settled_at?: string | null;
  vehicle_id?: string;
  vehicle_order?: number;
  // Admin fields
  agency_id?: string | null;
  expected_refund?: number | null;
  currency?: string;

  // Payment fields (DB에는 이미 있었으나 타입에 빠져 있던 것들)
  total_price?: number | null;
  adult_count?: number | null;
  child_count?: number | null;

  // Stripe 환불/캡처
  payment_intent_id?: string | null;
  captured_at?: string | null;      // NULL이면 승인만 된 상태
  refunded_amount?: number | null;  // 누적 환불 총액
  cancel_requested_at?: string | null;

  // UI/Transient fields
  isNew?: boolean;
  _grid_id?: string;
  _capacityStatus?: string;
  _capacityMsg?: string;
}

export type ReservationInsert = Omit<Reservation, 'id' | 'created_at'>;
export type ReservationUpdate = Partial<ReservationInsert>;

export const SOURCE_MAPPING: Record<string, string> = {
  'm': 'MyRealTrip',
  'z': 'ZoomZoom',
  't': 'Triple',
  'w': 'Waug',
  'v': 'Viator',
  '팜': '팜투어',
  '탐': '타미스',
  '클': '클록',
};
