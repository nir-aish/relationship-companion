-- Add Work-contact fields to relationships.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query). Safe to re-run.

alter table relationships
  add column if not exists role text,
  add column if not exists location text,
  add column if not exists family text;
