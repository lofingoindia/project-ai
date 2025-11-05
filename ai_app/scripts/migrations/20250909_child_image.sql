-- Migration: create child_image table for personalization uploads
-- Apply this in Supabase SQL editor or via Supabase CLI (supabase db push)

create table if not exists public.child_image (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  book_id text not null,
  cover_image_url text not null,
  child_image_url text not null,
  child_name text not null,
  child_age int not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.child_image enable row level security;

-- Users can insert their own records
create policy if not exists "child_image_insert_own" on public.child_image
for insert to authenticated with check (auth.uid() = user_id);

-- Users can read their own records
create policy if not exists "child_image_select_own" on public.child_image
for select to authenticated using (auth.uid() = user_id);


