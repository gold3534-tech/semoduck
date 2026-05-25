import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, tradeStatusLabel, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import { searchNaverShopping } from "@/lib/external/naver-shopping";
import { createDataSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

function queryFilter(keyword: string) {
  return `name.ilike.%${keyword}%,slug.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`;
}

function marketFilter(keyword: string) {
  return `title.ilike.%${keyword}%,description.ilike.%${keyword}%,region.ilike.%${keyword}%`;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const keyword = (params.q ?? "").trim();
  const supabase = createDataSupabaseClient();

  const [galleriesResult, marketResult, goodsResult] = keyword
    ? await Promise.all([
        supabase.from("galleries").select("id,name,slug,description,category,thumbnail_url,follower_count,post_count").or(queryFilter(keyword)).order("follower_count", { ascending: false }).limit(6),
        supabase
          .from("market_items")
          .select("id,title,description,trade_type,status,price,region,image_url,created_at,galleries(name,slug)")
          .in("status", ["active", "reserved", "completed"])
          .neq("trade_type", "transfer")
          .or(marketFilter(keyword))
          .order("created_at", { ascending: false })
          .limit(6),
        searchNaverShopping(keyword, 8)
      ])
    : [null, null, { items: [], error: null }];

  const galleries = galleriesResult?.data ?? [];
  const marketItems = (marketResult?.data ?? []).map((item) => ({ ...item, galleries: Array.isArray(item.galleries) ? item.galleries[0] : item.galleries }));
  const goods = goodsResult.items ?? [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#efd7e7] bg-gradient-to-br from-[#fff8fb] via-[#fbf1ff] to-[#fffaf0] p-7 shadow-soft md:p-10">
        <div className="pointer-events-none absolute right-8 top-8 hidden text-[#d7b9f4] md:block">
          <Sparkles size={72} />
        </div>
        <p className="text-sm font-black text-[#ff6f9b]">통합검색</p>
        <h1 className="mt-2 text-3xl font-black text-[#3a285f] md:text-4xl">{keyword ? `"${keyword}" 검색 결과` : "검색어를 입력해 주세요"}</h1>
        <p className="mt-3 text-sm font-bold text-[#70657f]">갤러리, 유저거래, 굿즈 링크를 한 번에 찾아볼 수 있어요.</p>
        <form action="/search" className="mt-6 flex min-h-14 max-w-3xl items-center gap-3 rounded-full border-2 border-[#e5c9ef] bg-white px-5 py-2 shadow-[0_14px_40px_rgba(163,108,224,0.12)] focus-within:border-[#a36ce0]">
          <Search size={20} className="shrink-0 text-[#8b61c8]" />
          <input name="q" defaultValue={keyword} className="min-w-0 flex-1 bg-transparent font-bold outline-none placeholder:text-slate-400" placeholder="갤러리, 유저거래, 굿즈 통합검색" />
          <button className="shrink-0 whitespace-nowrap rounded-2xl bg-[#3a285f] px-6 py-3 text-sm font-black text-white">검색</button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">갤러리</h2>
          {keyword ? <Link href={`/galleries?query=${encodeURIComponent(keyword)}`} className="text-sm font-black text-slate-500 hover:text-ink">전체보기</Link> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {galleries.map((gallery) => (
            <Link key={gallery.id} href={`/galleries/${gallery.slug}`} className="block">
              <Card className="grid h-full grid-cols-[6rem_1fr] gap-3 transition hover:-translate-y-1 hover:bg-[#fff7fb]">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f7f2fb]">
                  {gallery.thumbnail_url ? <Image src={gallery.thumbnail_url} alt="" fill className="object-cover" sizes="96px" /> : null}
                </div>
                <div className="min-w-0">
                  <Badge tone="mint">{gallery.category}</Badge>
                  <p className="mt-2 line-clamp-1 font-black">{gallery.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-500">{gallery.description}</p>
                  <p className="mt-2 text-xs font-black text-slate-400">팔로워 {(gallery.follower_count ?? 0).toLocaleString("ko-KR")}명</p>
                </div>
              </Card>
            </Link>
          ))}
          {keyword && !galleries.length ? <Card>맞는 갤러리가 없습니다.</Card> : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">유저거래</h2>
          {keyword ? <Link href="/market" className="text-sm font-black text-slate-500 hover:text-ink">거래판 보기</Link> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {marketItems.map((item) => (
            <Link key={item.id} href={`/market/${item.id}`} className="block">
              <Card className="overflow-hidden p-0 transition hover:-translate-y-1 hover:bg-[#fff7fb]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f7f2fb]">
                  {item.image_url ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-2">
                    {item.galleries?.name ? <Badge>{item.galleries.name}</Badge> : null}
                    <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
                    <Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status)}</Badge>
                  </div>
                  <p className="line-clamp-1 font-black">{item.title}</p>
                  <p className="text-lg font-black">{tradeValueLabel(item.trade_type, item.price)}</p>
                  <p className="text-xs font-bold text-slate-500">{item.region || "거래 방식 미입력"} · {formatDateTime(item.created_at)}</p>
                </div>
              </Card>
            </Link>
          ))}
          {keyword && !marketItems.length ? <Card>맞는 유저거래 글이 없습니다.</Card> : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">쇼핑검색</h2>
          {keyword ? <Link href={`/goods?q=${encodeURIComponent(keyword)}`} className="text-sm font-black text-slate-500 hover:text-ink">굿즈검색 더보기</Link> : null}
        </div>
        {goodsResult.error ? <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">{goodsResult.error}</p> : null}
        <div className="grid gap-4 md:grid-cols-4">
          {goods.map((item) => (
            <Card key={item.id} className="flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-1">
              <div className="relative aspect-square overflow-hidden bg-[#f7f2fb]">
                {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="line-clamp-2 font-black">{item.title}</p>
                <p className="text-xs font-bold text-slate-500">{item.mallName}</p>
                <p className="mt-auto text-lg font-black text-[#ff5f8d]">{formatPrice(item.price)}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#3a285f] px-3 text-sm font-black text-white">
                  열기 <ExternalLink size={14} />
                </a>
              </div>
            </Card>
          ))}
          {keyword && !goods.length && !goodsResult.error ? <Card>맞는 쇼핑 결과가 없습니다.</Card> : null}
        </div>
      </section>
    </div>
  );
}
