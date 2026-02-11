-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Crew Members Table
create table if not exists public.crew_members (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Crew Schedules Table
create table if not exists public.crew_schedules (
    id uuid default uuid_generate_v4() primary key,
    crew_id uuid not null references public.crew_members(id) on delete cascade,
    date date not null,
    option text not null, -- '1부', '2부', '3부', 'OFF' etc.
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(crew_id, date) -- One schedule per crew per day
);

-- 3. Crew Memos Table (Singleton for global notes)
create table if not exists public.crew_memos (
    id serial primary key,
    content text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert initial empty memo row if not exists
insert into public.crew_memos (id, content)
values (1, '')
on conflict (id) do nothing;

-- Enable RLS (Optional, depending on project policy, but good practice)
alter table public.crew_members enable row level security;
alter table public.crew_schedules enable row level security;
alter table public.crew_memos enable row level security;

-- Create policies (Public access for simplicity based on current project state, or strict if auth is used)
-- Assuming this is an admin tool with open access for authenticated users or public for now given context.
-- We will create full access policies.

create policy "Enable all access for crew_members" on public.crew_members
    for all using (true) with check (true);

create policy "Enable all access for crew_schedules" on public.crew_schedules
    for all using (true) with check (true);

create policy "Enable all access for crew_memos" on public.crew_memos
    for all using (true) with check (true);
