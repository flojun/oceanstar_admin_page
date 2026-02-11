-- 1. Create Captains Table
create table if not exists public.captains (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for captains
alter table public.captains enable row level security;
create policy "Enable all access for captains" on public.captains
    for all using (true) with check (true);

-- 2. Modify Crew Schedules Table
-- Add captain_id column
alter table public.crew_schedules 
add column if not exists captain_id uuid references public.captains(id) on delete set null;

-- Drop old unique constraint (crew_id, date) which allowed only 1 record per day
-- We need to check if the constraint exists first or just try to drop it.
-- Constraint name is usually "crew_schedules_crew_id_date_key".
alter table public.crew_schedules 
drop constraint if exists crew_schedules_crew_id_date_key;

-- Add new unique constraint (crew_id, date, option) to allow multiple shifts (1부, 2부, 3부) per day
alter table public.crew_schedules 
add constraint crew_schedules_crew_id_date_option_key unique (crew_id, date, option);
