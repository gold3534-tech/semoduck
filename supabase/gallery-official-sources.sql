create table if not exists public.gallery_official_sources (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid references public.galleries(id) on delete cascade,
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
select id, 'https://www.instagram.com/bts.bighitofficial/', 'https://weverseshop.io/', 'Weverse Shop', '공식 소식 채널은 BTS 공식 인스타그램, 공식 MD는 Weverse Shop을 우선 확인'
from public.galleries where slug = 'bts'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/sanrio_kr/', 'https://search.shopping.naver.com/ns/search?query=%EC%82%B0%EB%A6%AC%EC%98%A4&mallTypes=OFFICIAL_BRAND', '네이버 공식 브랜드스토어 검색', '한국 최신 소식은 산리오코리아 공식 인스타그램, 상품 후보는 네이버 공식 브랜드스토어 검색 우선'
from public.galleries where slug = 'sanrio'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/pokemon_korea_official/', 'https://www.pokemonstore.co.kr/', 'Pokemon Store Korea', '한국 최신 소식은 포켓몬코리아 공식 인스타그램, 공식 상품은 포켓몬스토어 코리아 우선'
from public.galleries where slug = 'pokemon'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/onepiece_korea_official/', 'https://www.daewonshop.com/', '대원샵', '한국 소식은 원피스 한국 공식 인스타그램, 구매 동선은 대원샵 우선'
from public.galleries where slug = 'onepiece'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/naver_webtoon/', 'https://brand.naver.com/webtoonfriends', 'WEBTOON FRIENDS', '네이버웹툰 공식 인스타그램과 WEBTOON FRIENDS 공식 굿즈 스토어 우선'
from public.galleries where slug = 'webtoon-goods'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://x.com/stellive_kr', 'https://fanding.kr/@stellive/shop', '스텔라이브 Fanding Shop', '스텔라이브는 공식 X와 Fanding 공식 판매샵 우선'
from public.galleries where slug = 'stellive'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://www.instagram.com/leagueoflegendskorea/', 'https://brand.naver.com/riot-store/category/f65ad626f5db4ea187f5a804dd2ce156?st=POPULAR&dt=BIG_IMAGE&page=1&size=40', 'Riot Store 네이버 공식 브랜드스토어', '한국 소식은 리그 오브 레전드 한국 공식 인스타그램, 상품은 Riot Store 네이버 공식 브랜드스토어 우선'
from public.galleries where slug = 'lol'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

insert into public.gallery_official_sources (gallery_id, official_site_url, official_shop_url, shop_label, notes)
select id, 'https://x.com/_EternalReturn_', 'https://estar-egg.com/product/list.html?cate_no=43', 'ESTAR EGG 이터널 리턴 공식굿즈', '공식 X와 ESTAR EGG 공식굿즈 카테고리 우선'
from public.galleries where slug = '이터널리턴'
on conflict (gallery_id) do update set official_site_url = excluded.official_site_url, official_shop_url = excluded.official_shop_url, shop_label = excluded.shop_label, notes = excluded.notes, updated_at = now();

notify pgrst, 'reload schema';
