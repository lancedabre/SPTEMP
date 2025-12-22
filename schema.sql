-- schema.sql
-- Run this code in the Supabase SQL Editor to set up your database.

-- 1. Create the Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  title text default 'Untitled',
  content jsonb default '[]',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null -- Optional: links script to a user
);

-- 2. Enable Row Level Security (Security Policy)
alter table public.projects enable row level security;

-- 3. Create Policies (This ensures users can only edit their own work)
create policy "Users can view their own projects" 
  on projects for select 
  using ( auth.uid() = user_id );

create policy "Users can create their own projects" 
  on projects for insert 
  with check ( auth.uid() = user_id );

create policy "Users can update their own projects" 
  on projects for update 
  using ( auth.uid() = user_id );

create policy "Users can delete their own projects" 
  on projects for delete 
  using ( auth.uid() = user_id );