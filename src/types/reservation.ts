export type ReservationStatus = '예약확정' | '취소' | '대기' | '취소요청' | '예약대기' | string;

export interface Reservation {
  id: string;
  created_at: string;
  is_reconfirmed: boolean; // New Checkbox
  status: ReservationStatus;
  receipt_date: string; // YYYY-MM-DD
  source: string;
  name: string;
  tour_date: string; // YYYY-MM-DD
  pax: string;
  option: string;
  pickup_location: string;
  contact: string;
  note: string;
  // Settlement fields
  settlement_status?: 'completed' | 'excluded' | null;
  settled_at?: string | null;
  vehicle_id?: string;
  vehicle_order?: number;
  // Admin fields
  agency_id?: string | null;

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
};
