alter table public.products
  add column if not exists report_count integer not null default 0,
  add column if not exists is_deleted boolean not null default false;

alter table public.market_items
  add column if not exists report_count integer not null default 0;

notify pgrst, 'reload schema';
