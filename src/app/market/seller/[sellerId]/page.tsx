import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HeartHandshake,
  MapPin,
  Package,
  Search,
} from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  formatDateTime,
  tradeStatusLabel,
  tradeTypeLabel,
  tradeValueLabel,
} from "@/lib/format";
import { parseImageUrls } from "@/lib/image-urls";
import { createDataSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

type SellerProfile = {
  id: string;
  email?: string | null;
  nickname?: string | null;
  profile_image?: string | null;
};

type SellerMarketItem = {
  id: string;
  seller_id: string;
  title: string;
  description?: string | null;
  trade_type: string;
  status: string;
  price: number;
  region?: string | null;
  image_url?: string | null;
  created_at: string;
  galleries?:
    | { name?: string | null; slug?: string | null }
    | Array<{ name?: string | null; slug?: string | null }>
    | null;
};

function getGallery(galleries: SellerMarketItem["galleries"]) {
  return Array.isArray(galleries) ? galleries[0] ?? null : galleries ?? null;
}

export default async function SellerMarketPage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;
  const supabase = createDataSupabaseClient();

  const [{ data: sellerData }, { data: itemsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,nickname,profile_image")
      .eq("id", sellerId)
      .maybeSingle(),

    supabase
      .from("market_items")
      .select(
        "id,seller_id,title,description,trade_type,status,price,region,image_url,created_at,galleries(name,slug)"
      )
      .eq("seller_id", sellerId)
      .neq("trade_type", "transfer")
      .not("status", "in", "(hidden,reported)")
      .order("created_at", { ascending: false }),
  ]);

  const seller = sellerData as SellerProfile | null;
  const items = (itemsData ?? []) as SellerMarketItem[];

  if (!seller && !items.length) {
    notFound();
  }

  const sellerName =
    seller?.nickname ?? seller?.email?.split("@")[0] ?? "세모덕러";

  const activeCount = items.filter((item) => item.status === "active").length;
  const reservedCount = items.filter((item) => item.status === "reserved").length;
  const completedCount = items.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/">홈</Link>
        <span>&gt;</span>
        <Link href="/market">유저거래</Link>
        <span>&gt;</span>
        <span>{sellerName}님의 거래글</span>
      </nav>

      <Card className="overflow-hidden rounded-[1.75rem] border border-[#ead0f4] bg-white/90 p-5">
        <div className="grid gap-4 md:grid-cols-[6rem_1fr_auto] md:items-center">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[#fbf4ff] ring-4 ring-[#ffe4f0]">
            <SafeImage
              src={seller?.profile_image ?? "/semoduck-profile-duck.png"}
              alt=""
              kind="profile"
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <p className="text-sm font-black text-[#ff6f9b]">Seller</p>

            <h1 className="mt-1 text-2xl font-black text-[#3a285f]">
              {sellerName}님의 유저거래
            </h1>

            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              이 판매자가 등록한 판매, 교환, 나눔 글을 모아봤어요.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="mint">전체 {items.length}개</Badge>
              <Badge tone="pink">거래 가능 {activeCount}개</Badge>
              <Badge tone="sun">예약중 {reservedCount}개</Badge>
              <Badge tone="gray">거래완료 {completedCount}개</Badge>
            </div>
          </div>

          <Link
            href="/market"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#6f4ab4] ring-1 ring-[#ead8f4] transition hover:bg-[#fbf4ff]"
          >
            <Search size={15} />
            전체 거래 보기
          </Link>
        </div>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-black text-[#3a285f]">
            <HeartHandshake size={20} className="text-[#a56be8]" />
            등록한 유저거래글
          </h2>
        </div>

        {items.length ? (
          <div className="grid gap-3">
            {items.map((item) => {
              const gallery = getGallery(item.galleries);
              const imageCandidates = parseImageUrls(item.image_url);
              const mainImage = imageCandidates[0] ?? null;

              return (
                <Link
                  key={item.id}
                  href={`/market/${item.id}`}
                  className="block"
                >
                  <Card className="grid gap-4 overflow-hidden rounded-[1.5rem] p-3 transition hover:-translate-y-0.5 hover:bg-[#fff8fb] hover:shadow-soft md:grid-cols-[10rem_1fr_auto] md:items-center">
                    <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-[#f7f2fb] md:aspect-square">
                      <SafeImage
                        src={mainImage}
                        alt={item.title}
                        kind="product"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {gallery?.name ? <Badge>{gallery.name}</Badge> : null}

                        <Badge tone="mint">
                          {tradeTypeLabel(item.trade_type as never)}
                        </Badge>

                        <Badge
                          tone={item.status === "active" ? "pink" : "sun"}
                        >
                          {tradeStatusLabel(item.status as never)}
                        </Badge>
                      </div>

                      <h3 className="line-clamp-1 text-lg font-black text-[#2f2352]">
                        {item.title}
                      </h3>

                      <p className="text-xl font-black text-[#ff5f8d]">
                        {tradeValueLabel(item.trade_type as never, item.price)}
                      </p>

                      <p className="line-clamp-2 text-sm font-bold leading-6 text-slate-600">
                        {item.description || "상세 설명이 없습니다."}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2.5 py-1">
                          <MapPin size={13} />
                          {item.region || "거래 방식 미입력"}
                        </span>

                        <span className="rounded-full bg-cloud px-2.5 py-1">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="hidden text-[#8b61c8] md:block">
                      &gt;
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="grid min-h-52 place-items-center rounded-[1.5rem] p-6 text-center">
            <div>
              <Package className="mx-auto text-[#a56be8]" size={36} />

              <p className="mt-3 font-black text-[#3a285f]">
                아직 등록한 거래글이 없습니다.
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                판매자가 새 거래글을 등록하면 이곳에 표시됩니다.
              </p>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}