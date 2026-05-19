import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, tradeStatusLabel, tradeTypeLabel } from "@/lib/format";
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
      <div>
        <p className="text-sm font-black text-berry">통합검색</p>
        <h1 className="mt-2 text-3xl font-black">{keyword ? `"${keyword}" 검색 결과` : "검색어를 입력해 주세요"}</h1>
      </div>

      <Card>
        <form action="/search" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 focus-within:border-berry">
          <Search size={18} className="text-slate-400" />
          <input name="q" defaultValue={keyword} className="w-full outline-none" placeholder="갤러리, 유저거래, 굿즈 통합검색" />
          <button className="rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">검색</button>
        </form>
      </Card>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">갤러리</h2>
          {keyword ? <Link href={`/galleries?query=${encodeURIComponent(keyword)}`} className="text-sm font-black text-slate-500 hover:text-ink">전체보기</Link> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {galleries.map((gallery) => (
            <Link key={gallery.id} href={`/galleries/${gallery.slug}`} className="block">
              <Card className="grid h-full grid-cols-[6rem_1fr] gap-3 transition hover:bg-pink-50">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
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
              <Card className="overflow-hidden p-0 transition hover:bg-pink-50">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {item.image_url ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-2">
                    {item.galleries?.name ? <Badge>{item.galleries.name}</Badge> : null}
                    <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
                    <Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status)}</Badge>
                  </div>
                  <p className="line-clamp-1 font-black">{item.title}</p>
                  <p className="text-lg font-black">{formatPrice(item.price)}</p>
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
            <Card key={item.id} className="flex h-full flex-col overflow-hidden p-0">
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="line-clamp-2 font-black">{item.title}</p>
                <p className="text-xs font-bold text-slate-500">{item.mallName}</p>
                <p className="mt-auto text-lg font-black">{formatPrice(item.price)}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-black text-white">
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
