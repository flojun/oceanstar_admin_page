create table if not exists drivers (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- Enable RLS (optional, strictly speaking, but good practice)
alter table drivers enable row level security;

-- Policy (Open for now as per admin app nature)
create policy "Enable all access for authenticated users" on drivers for all using (true) with check (true);
create policy "Enable read access for anon" on drivers for select using (true); 
