create table if not exists public.admin_suggestions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null default 'gallery_request',
  title text not null,
  detail text not null,
  requested_gallery_name text,
  requested_gallery_slug text,
  requested_gallery_category text,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.admin_suggestions enable row level security;

drop policy if exists "own suggestions read" on public.admin_suggestions;
create policy "own suggestions read" on public.admin_suggestions
for select using (auth.uid() = user_id);

drop policy if exists "own suggestions insert" on public.admin_suggestions;
create policy "own suggestions insert" on public.admin_suggestions
for insert with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
