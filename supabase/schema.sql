create extension if not exists "uuid-ossp";

create type public.user_role as enum ('user', 'admin', 'guest');
create type public.post_type as enum ('general', 'question', 'review', 'purchase_help', 'info', 'trade', 'transfer', 'giveaway', 'notice');
create type public.offer_source as enum ('official_shop', 'naver_shopping', 'coupang', 'user_submission', 'internal_market', 'external_search');
create type public.trade_type as enum ('sell', 'exchange', 'transfer', 'giveaway');
create type public.trade_status as enum ('active', 'reserved', 'completed', 'hidden', 'reported');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  nickname text not null default '세모덕 유저',
  profile_image text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text not null
);

create table public.user_interests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  interest_id uuid references public.interests(id) on delete cascade,
  unique (user_id, interest_id)
);

create table public.galleries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  thumbnail_url text,
  follower_count integer not null default 0,
  post_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.gallery_follows (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  gallery_id uuid references public.galleries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, gallery_id)
);

create table public.gallery_official_sources (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  official_site_url text not null,
  official_shop_url text,
  shop_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gallery_id)
);

create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid references public.galleries(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  content text not null,
  post_type public.post_type not null default 'general',
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  bookmark_count integer not null default 0,
  image_url text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  like_count integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

create table public.post_tags (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  unique (post_id, tag_id)
);

create table public.post_reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'bookmark')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

create table public.products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  normalized_title text not null,
  brand text,
  category text not null,
  description text,
  image_url text,
  is_official_product boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_offers (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  source public.offer_source not null,
  mall_name text not null,
  price integer not null,
  shipping_fee integer not null default 0,
  condition text not null default 'unknown',
  is_official boolean not null default false,
  is_used boolean not null default false,
  special_benefit text,
  url text not null,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.market_items (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references public.profiles(id) on delete set null,
  gallery_id uuid references public.galleries(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  trade_type public.trade_type not null,
  title text not null,
  description text not null,
  price integer not null default 0,
  region text,
  status public.trade_status not null default 'active',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_inquiries (
  id uuid primary key default uuid_generate_v4(),
  market_item_id uuid references public.market_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_interests enable row level security;
alter table public.gallery_follows enable row level security;
alter table public.gallery_official_sources enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.products enable row level security;
alter table public.product_offers enable row level security;
alter table public.market_items enable row level security;
alter table public.market_inquiries enable row level security;
alter table public.reports enable row level security;

create policy "profiles readable by owner" on public.profiles for select using (auth.uid() = id);
create policy "profiles update by owner" on public.profiles for update using (auth.uid() = id);
create policy "public gallery official sources read" on public.gallery_official_sources for select using (true);
create policy "public posts read" on public.posts for select using (is_deleted = false);
create policy "public comments read" on public.comments for select using (is_deleted = false);
create policy "own reactions read" on public.post_reactions for select using (auth.uid() = user_id);
create policy "own reactions insert" on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "own reactions delete" on public.post_reactions for delete using (auth.uid() = user_id);
create policy "public products read" on public.products for select using (true);
create policy "public offers read" on public.product_offers for select using (true);
create policy "public market read" on public.market_items for select using (status in ('active', 'reserved', 'completed'));
create policy "public market inquiries read" on public.market_inquiries for select using (is_deleted = false);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname, profile_image, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '세모덕 유저'),
    new.raw_user_meta_data->>'avatar_url',
    case when lower(new.email) = 'gold3534@gmail.com' then 'admin'::public.user_role else 'user'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
