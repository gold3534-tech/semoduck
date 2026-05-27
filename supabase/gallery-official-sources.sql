create table if not exists public.gallery_official_sources (
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

alter table public.gallery_official_sources enable row level security;

drop policy if exists "public gallery official sources read" on public.gallery_official_sources;
create policy "public gallery official sources read" on public.gallery_official_sources
for select using (true);

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/bts.bighitofficial/', 'https://weverseshop.io/', 'Weverse Shop', 'BTS official SNS and official MD shop.'
from public.galleries where slug = 'bts'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/sanrio_kr/', 'https://search.shopping.naver.com/ns/search?query=%EC%82%B0%EB%A6%AC%EC%98%A4&mallTypes=OFFICIAL_BRAND', 'Naver official brand search', 'Sanrio Korea official SNS and official brand search.'
from public.galleries where slug = 'sanrio'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/pokemon_korea_official/', 'https://www.pokemonstore.co.kr/', 'Pokemon Store Korea', 'Pokemon Korea official SNS and official shop.'
from public.galleries where slug = 'pokemon'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/onepiece_korea_official/', 'https://www.daewonshop.com/', 'Daewon Shop', 'One Piece Korea official SNS and Daewon Shop.'
from public.galleries where slug = 'onepiece'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/naver_webtoon/', 'https://brand.naver.com/webtoonfriends', 'WEBTOON FRIENDS', 'Naver Webtoon official SNS and WEBTOON FRIENDS shop.'
from public.galleries where slug = 'webtoon-goods'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://x.com/stellive_kr', 'https://fanding.kr/@stellive/shop', 'Stellive Fanding Shop', 'Stellive official X and Fanding shop.'
from public.galleries where slug = 'stellive'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/leagueoflegendskorea/', 'https://brand.naver.com/riot-store/category/f65ad626f5db4ea187f5a804dd2ce156?st=POPULAR&dt=BIG_IMAGE&page=1&size=40', 'Riot Store', 'League of Legends Korea official SNS and Riot Store official brand shop.'
from public.galleries where slug = 'lol'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://x.com/_EternalReturn_', 'https://estar-egg.com/product/list.html?cate_no=43', 'ESTAR EGG', 'Eternal Return official X and ESTAR EGG official goods category.'
from public.galleries where slug = 'eternal-return'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/dotorisup/reels/', 'https://www.dotorisup.com/', 'Dotorisup', 'Dotorisup official SNS and official shop.'
from public.galleries where slug = 'ghibli'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

notify pgrst, 'reload schema';
