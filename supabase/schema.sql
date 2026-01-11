-- Create tables for the AI Finance Tracker App

-- USERS table (managed by Supabase Auth, but we can extend public.users if needed or just use auth.users)
-- For this app, we'll reference auth.users directly in transactions.

-- TRANSACTIONS table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Changed to text to support Guest ID
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  amount numeric not null,
  description text,
  date date default CURRENT_DATE,
  source text check (source in ('chat', 'ocr', 'voice', 'manual')) default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for transactions
alter table public.transactions enable row level security;

-- Policy: Users can only see their own transactions
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own transactions
create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

-- AI LOGS table (Optional, for debugging/stats)
create table public.ai_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prompt text,
  response text,
  tokens_used integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for ai_logs
alter table public.ai_logs enable row level security;

create policy "Users can view their own logs"
  on public.ai_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on public.ai_logs for insert
  with check (auth.uid() = user_id);
