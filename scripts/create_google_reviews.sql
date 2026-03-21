-- Create the google_reviews table
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  google_review_id text UNIQUE NOT NULL,
  author_name text NOT NULL,
  profile_photo_url text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text,
  time timestamp with time zone NOT NULL,
  photos text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the frontend to display reviews)
CREATE POLICY "Enable read access for all users" ON public.google_reviews
  FOR SELECT USING (true);

-- Allow service role to insert/update reviews
CREATE POLICY "Enable insert for service role" ON public.google_reviews
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON public.google_reviews
  FOR UPDATE USING (true);
