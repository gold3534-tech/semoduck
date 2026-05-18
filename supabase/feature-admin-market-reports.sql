alter table public.reports
  add column if not exists category text,
  add column if not exists detail text,
  add column if not exists resolved_by uuid references public.profiles(id) on delete set null,
  add column if not exists resolved_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_unique_reporter_target'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_unique_reporter_target unique (reporter_id, target_type, target_id);
  end if;
end $$;

alter table public.posts
  add column if not exists report_count integer not null default 0;

create or replace function public.recalculate_gallery_follower_count(target_gallery_id uuid)
returns void
language sql
security definer
as $$
  update public.galleries
  set follower_count = (
    select count(*)::integer
    from public.gallery_follows
    where gallery_id = target_gallery_id
  )
  where id = target_gallery_id;
$$;

create or replace function public.recalculate_post_report_count(target_post_id uuid)
returns void
language sql
security definer
as $$
  update public.posts
  set report_count = (
    select count(*)::integer
    from public.reports
    where target_type = 'post'
      and target_id = target_post_id
      and status = 'pending'
  ),
  is_deleted = case
    when (
      select count(*)::integer
      from public.reports
      where target_type = 'post'
        and target_id = target_post_id
        and status = 'pending'
    ) >= 5 then true
    else is_deleted
  end,
  updated_at = now()
  where id = target_post_id;
$$;

drop policy if exists "public galleries read" on public.galleries;
create policy "public galleries read" on public.galleries
for select using (true);

drop policy if exists "own gallery follows read" on public.gallery_follows;
create policy "own gallery follows read" on public.gallery_follows
for select using (auth.uid() = user_id);

drop policy if exists "own gallery follows insert" on public.gallery_follows;
create policy "own gallery follows insert" on public.gallery_follows
for insert with check (auth.uid() = user_id);

drop policy if exists "own gallery follows delete" on public.gallery_follows;
create policy "own gallery follows delete" on public.gallery_follows
for delete using (auth.uid() = user_id);

drop policy if exists "own market insert" on public.market_items;
create policy "own market insert" on public.market_items
for insert with check (auth.uid() = seller_id);

drop policy if exists "own market update" on public.market_items;
create policy "own market update" on public.market_items
for update using (auth.uid() = seller_id);

drop policy if exists "own reports insert" on public.reports;
create policy "own reports insert" on public.reports
for insert with check (auth.uid() = reporter_id);

notify pgrst, 'reload schema';
