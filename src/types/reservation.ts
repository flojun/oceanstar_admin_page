export type ReservationStatus = '예약확정' | '취소' | '대기' | string;

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
  note: string; // End of Reservation interface
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
