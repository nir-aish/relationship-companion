-- Add Personal / Work category to relationships.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query). Safe to re-run.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'relationship_category') then
    create type relationship_category as enum ('personal', 'work');
  end if;
end$$;

alter table relationships
  add column if not exists category relationship_category not null default 'personal';
