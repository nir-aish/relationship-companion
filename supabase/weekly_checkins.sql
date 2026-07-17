-- Weekly check-in — table + row level security
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run.

create table if not exists weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start timestamptz not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, period_start)
);

create index if not exists weekly_checkins_user_idx on weekly_checkins (user_id);

alter table weekly_checkins enable row level security;

drop policy if exists "own_select" on weekly_checkins;
create policy "own_select" on weekly_checkins
  for select using (auth.uid() = user_id);

drop policy if exists "own_insert" on weekly_checkins;
create policy "own_insert" on weekly_checkins
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_delete" on weekly_checkins;
create policy "own_delete" on weekly_checkins
  for delete using (auth.uid() = user_id);
