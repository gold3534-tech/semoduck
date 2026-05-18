create table if not exists public.post_reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'bookmark')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

alter table public.post_reactions enable row level security;

drop policy if exists "own reactions read" on public.post_reactions;
drop policy if exists "own reactions insert" on public.post_reactions;
drop policy if exists "own reactions delete" on public.post_reactions;

create policy "own reactions read" on public.post_reactions
for select using (auth.uid() = user_id);

create policy "own reactions insert" on public.post_reactions
for insert with check (auth.uid() = user_id);

create policy "own reactions delete" on public.post_reactions
for delete using (auth.uid() = user_id);

create or replace function public.increment_post_comment_count(target_post_id uuid)
returns void
language sql
security definer
as $$
  update public.posts
  set comment_count = comment_count + 1,
      updated_at = now()
  where id = target_post_id;
$$;
