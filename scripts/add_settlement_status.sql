-- Add settlement status columns to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS settlement_status text DEFAULT NULL, -- NULL(pending), 'completed', 'excluded'
ADD COLUMN IF NOT EXISTS settled_at timestamptz DEFAULT NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_reservations_settlement_status ON reservations(settlement_status);
CREATE INDEX IF NOT EXISTS idx_reservations_tour_date_settlement ON reservations(tour_date, settlement_status);
