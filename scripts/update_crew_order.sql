-- Add sort_order column to crew_members for custom ordering
alter table public.crew_members 
add column if not exists sort_order integer default 0;

-- Initialize sort_order based on name or created_at if needed
-- with cte as (
--   select id, row_number() over (order by created_at) as rn
--   from public.crew_members
-- )
-- update public.crew_members c
-- set sort_order = cte.rn
-- from cte
-- where c.id = cte.id;
