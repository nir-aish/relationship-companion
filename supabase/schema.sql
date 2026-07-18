-- Relationship Companion — database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is safe to re-run: it uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cadence') then
    create type cadence as enum ('1week', '2weeks', '3weeks');
  end if;
  if not exists (select 1 from pg_type where typname = 'interaction_type') then
    create type interaction_type as enum ('message', 'call', 'met', 'video', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'relationship_category') then
    create type relationship_category as enum ('personal', 'work');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  photo text,
  birthday date,
  category relationship_category not null default 'personal',
  cadence cadence not null default '2weeks',
  last_interaction_date date,
  role text,
  location text,
  family text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  relationship_id uuid not null references relationships (id) on delete cascade,
  title text not null,
  date date not null,
  notes text,
  is_birthday boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists context_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  relationship_id uuid not null references relationships (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  relationship_id uuid not null references relationships (id) on delete cascade,
  date date not null default current_date,
  type interaction_type not null default 'message',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists relationships_user_idx on relationships (user_id);
create index if not exists events_rel_idx on events (relationship_id);
create index if not exists context_rel_idx on context_entries (relationship_id);
create index if not exists interactions_rel_idx on interactions (relationship_id);

-- ----------------------------------------------------------------------------
-- Row Level Security — each user only sees their own rows
-- ----------------------------------------------------------------------------
alter table relationships enable row level security;
alter table events enable row level security;
alter table context_entries enable row level security;
alter table interactions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['relationships', 'events', 'context_entries', 'interactions']
  loop
    execute format('drop policy if exists "own_select" on %I', t);
    execute format('drop policy if exists "own_insert" on %I', t);
    execute format('drop policy if exists "own_update" on %I', t);
    execute format('drop policy if exists "own_delete" on %I', t);

    execute format(
      'create policy "own_select" on %I for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "own_insert" on %I for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own_update" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own_delete" on %I for delete using (auth.uid() = user_id)', t);
  end loop;
end$$;

-- ----------------------------------------------------------------------------
-- Storage: "avatars" bucket for uploaded profile photos
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_auth_insert" on storage.objects;
create policy "avatars_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

drop policy if exists "avatars_auth_update" on storage.objects;
create policy "avatars_auth_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

drop policy if exists "avatars_auth_delete" on storage.objects;
create policy "avatars_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');
