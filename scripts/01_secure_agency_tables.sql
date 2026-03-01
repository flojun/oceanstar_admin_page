-- 1. Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow all access to authenticated users on agencies" ON public.agencies;

-- 2. Create tighter policies
-- Allow the service role to do everything (Supabase bypasses RLS anyway with service role, but good practice if needed)
CREATE POLICY "Allow service role full access to agencies"
ON public.agencies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read agency data (excluding passwords ideally, but supabase JS client needs to be able to verify login if we don't use a secure backend endpoint entirely. Since we moved login to a Server Action, we should restrict this further).
-- Since ALL agency auth is handled by Next.js Server Actions using the Service Role Key (implicitly or explicitly), 
-- we can completely lock down the agencies table from the public API (anon AND authenticated).

CREATE POLICY "Deny all public access to agencies"
ON public.agencies
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Note: The Next.js server actions MUST use the Service Role Key to query the `agencies` table now.
