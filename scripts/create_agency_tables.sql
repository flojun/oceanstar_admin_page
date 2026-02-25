-- Create agencies table
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    login_id TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated users (can restrict to admin if needed)
CREATE POLICY "Allow all access to authenticated users on agencies"
ON public.agencies
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Create agency notifications table
CREATE TABLE IF NOT EXISTS public.agency_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'CREATED', 'UPDATED', 'CANCELLED'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agency_notifications ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated users
CREATE POLICY "Allow all access to authenticated users on agency_notifications"
ON public.agency_notifications
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Add agency_id to reservations table to link them
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- In case agency deletes the account, we just keep the reservation but nullify the agency_id.
