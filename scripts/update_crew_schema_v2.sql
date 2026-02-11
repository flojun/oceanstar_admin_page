-- Create Shift Captains Table (Assigns a captain to a global shift)
create table if not exists public.shift_captains (
    id uuid default uuid_generate_v4() primary key,
    date date not null,
    option text not null, -- '1부', '2부', '3부'
    captain_id uuid references public.captains(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (date, option)
);

-- Modify Crew Schedules to support Role instead of just Captain
alter table public.crew_schedules 
add column if not exists role text default 'CREW'; -- 'CREW', 'MC'

-- Optional: Drop captain_id from crew_schedules if it's no longer needed
-- For now, we will just ignore it.
