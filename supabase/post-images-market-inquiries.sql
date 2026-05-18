alter table public.posts
  add column if not exists image_url text;

create table if not exists public.market_inquiries (
  id uuid primary key default uuid_generate_v4(),
  market_item_id uuid references public.market_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_inquiries enable row level security;

drop policy if exists "public market inquiries read" on public.market_inquiries;
create policy "public market inquiries read" on public.market_inquiries
for select using (is_deleted = false);

drop policy if exists "own market inquiries insert" on public.market_inquiries;
create policy "own market inquiries insert" on public.market_inquiries
for insert with check (auth.uid() = user_id);

drop policy if exists "own market inquiries update" on public.market_inquiries;
create policy "own market inquiries update" on public.market_inquiries
for update using (auth.uid() = user_id);

drop policy if exists "own market inquiries delete" on public.market_inquiries;
create policy "own market inquiries delete" on public.market_inquiries
for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
