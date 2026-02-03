-- Migrate existing reservation sources to abbreviated format
-- Run this in Supabase SQL Editor

UPDATE reservations
SET source = CASE 
    WHEN source = 'MyRealTrip' THEN 'M'
    WHEN source = 'ZoomZoom' THEN 'Z'
    WHEN source = 'Triple' THEN 'T'
    WHEN source = 'Waug' THEN 'W'
    WHEN source = 'KTB' THEN 'KTB'  -- Keep KTB as is
    ELSE source  -- Keep any other values unchanged
END
WHERE source IN ('MyRealTrip', 'ZoomZoom', 'Triple', 'Waug', 'KTB');

-- Verify the changes
SELECT source, COUNT(*) as count
FROM reservations
GROUP BY source
ORDER BY count DESC;
