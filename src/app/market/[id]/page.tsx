import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Heart, MapPin, MessageCircle, Package, Send, UserRound } from "lucide-react";
import { InquiryActions } from "@/app/market/[id]/inquiry-actions";
import { InquiryForm } from "@/app/market/[id]/inquiry-form";
import { MarketOwnerActions } from "@/app/market/[id]/owner-actions";
import { RelatedPostList, type RelatedPostItem } from "@/components/related-post-list";
import { ReportButton } from "@/components/report-button";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractPostKeywords } from "@/lib/ai";
import { isAdminEmail } from "@/lib/auth";
import { formatDateTime, tradeStatusLabel, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import { extractRelevantTokens, sortByRelevance } from "@/lib/relevance";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MarketRow = {
  id: string;
  seller_id?: string | null;
  title: string;
  description?: string | null;
  trade_type: string;
  status: string;
  price: number;
  region?: string | null;
  image_url?: string | null;
  created_at: string;
  profiles?: { nickname?: string | null; email?: string | null } | Array<{ nickname?: string | null; email?: string | null }> | null;
  galleries?: { name?: string | null; slug?: string | null } | Array<{ name?: string | null; slug?: string | null }> | null;
};

function relatedTermsForMarket(item: { title: string; description?: string | null; galleries?: { name?: string | null; slug?: string | null } | null }) {
  return extractRelevantTokens([item.title, item.description, item.galleries?.name, item.galleries?.slug], 10);
}

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: auth } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const currentUserId = auth.user?.id;
  const isAdmin = isAdminEmail(auth.user?.email);

  const [{ data: itemData }, { data: inquiries }] = await Promise.all([
    supabase
      .from("market_items")
      .select("id,seller_id,title,description,trade_type,status,price,region,image_url,created_at,profiles(nickname,email),galleries(name,slug)")
      .eq("id", id)
      .neq("trade_type", "transfer")
      .not("status", "in", "(hidden,reported)")
      .single(),
    supabase
      .from("market_inquiries")
      .select("id,user_id,content,created_at,profiles(nickname,email)")
      .eq("market_item_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
  ]);

  const item = itemData as MarketRow | null;
  if (!item) notFound();

  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const gallery = Array.isArray(item.galleries) ? item.galleries[0] : item.galleries;
  const normalizedItem = { ...item, galleries: gallery };
  const imageCandidates = [item.image_url].filter((url): url is string => Boolean(url));
  const mainImage = imageCandidates[0] ?? null;
  const isOwner = currentUserId === item.seller_id;

  const aiPostKeywords = await extractPostKeywords(`${item.title}\n${item.description ?? ""}\n${gallery?.name ?? ""}`);
  const relatedTerms = [...new Set([...aiPostKeywords.post_keywords, ...relatedTermsForMarket(normalizedItem)])].slice(0, 10);
  const relatedFilters = relatedTerms.flatMap((term) => [`title.ilike.%${term}%`, `content.ilike.%${term}%`]);
  const { data: relatedPostRows } = relatedFilters.length
    ? await supabase
        .from("posts")
        .select("id,title,content,post_type,like_count,comment_count,image_url,galleries(name,slug)")
        .or(relatedFilters.join(","))
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };
  const relatedPosts = sortByRelevance(
    (relatedPostRows ?? []) as RelatedPostItem[],
    relatedTerms,
    (post) => [post.title, post.content, post.galleries?.name, post.galleries?.slug],
    (post) => Number(post.like_count ?? 0) + Number(post.comment_count ?? 0),
    25
  ).slice(0, 6);

  return (
    <div className="space-y-3">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/">홈</Link>
        <span>&gt;</span>
        <Link href="/market">유저거래</Link>
        <span>&gt;</span>
        {gallery?.name ? <span>{gallery.name}</span> : null}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-3">
          <Card className="space-y-4 p-4">
            <div className="space-y-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#f7f2fb] sm:aspect-[16/9]">
                <SafeImage src={mainImage} alt={item.title} kind="product" loading="eager" className="h-full w-full object-contain" />
                <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#ff6f9b] ring-1 ring-[#f4dbe7]"><Heart size={18} /></span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {(imageCandidates.length ? imageCandidates : [mainImage]).slice(0, 5).map((image, index) => (
                  <div key={`${image ?? "fallback"}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb] ring-1 ring-[#ead8f4]">
                    <SafeImage src={image} alt="" kind="product" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status as never)}</Badge>
                {gallery?.name ? <Badge>{gallery.name}</Badge> : null}
                <Badge tone="mint">{tradeTypeLabel(item.trade_type as never)}</Badge>
              </div>
              <h1 className="text-3xl font-black leading-tight text-[#3a285f] md:text-4xl">{item.title}</h1>
              <p className="text-2xl font-black text-[#ff5f8d]">{tradeValueLabel(item.trade_type as never, item.price)}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5"><UserRound size={15} /> {profile?.nickname ?? profile?.email ?? "회원"}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {item.region || "거래 지역 협의"}</span>
                <span>{formatDateTime(item.created_at)}</span>
              </div>
              <div className="grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
                <p className="rounded-xl bg-[#fbf4ff] px-3 py-2">거래 유형 <span className="ml-2 text-[#3a285f]">{tradeTypeLabel(item.trade_type as never)}</span></p>
                <p className="rounded-xl bg-[#fbf4ff] px-3 py-2">상품 상태 <span className="ml-2 text-[#3a285f]">{item.status === "completed" ? "거래완료" : "거래 가능"}</span></p>
                <p className="rounded-xl bg-[#fbf4ff] px-3 py-2">배송 방법 <span className="ml-2 text-[#3a285f]">택배/직거래 협의</span></p>
                <p className="rounded-xl bg-[#fbf4ff] px-3 py-2">거래 장소 <span className="ml-2 text-[#3a285f]">{item.region || "협의 가능"}</span></p>
              </div>
              <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-slate-600">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                {!isOwner ? <Button className="min-h-9 rounded-xl px-4 py-1.5 text-xs"><Send size={15} /> 거래톡 보내기</Button> : null}
                <Button variant="secondary" className="min-h-9 rounded-xl px-4 py-1.5 text-xs"><Heart size={15} /> 찜하기</Button>
                {!isOwner ? <ReportButton targetType="market_item" targetId={id} /> : null}
                {isOwner || isAdmin ? <MarketOwnerActions marketItemId={id} currentStatus={item.status} canEdit={isOwner} /> : null}
              </div>
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]"><Package size={18} /> 거래 정보</h2>
              <dl className="mt-3 divide-y divide-[#f1dbe8] text-sm font-bold">
                <div className="grid grid-cols-[7rem_1fr] py-2"><dt className="text-[#6f4ab4]">배송 방법</dt><dd className="text-slate-600">택배 거래 또는 직거래</dd></div>
                <div className="grid grid-cols-[7rem_1fr] py-2"><dt className="text-[#6f4ab4]">배송비</dt><dd className="text-slate-600">구매자 부담</dd></div>
                <div className="grid grid-cols-[7rem_1fr] py-2"><dt className="text-[#6f4ab4]">직거래 지역</dt><dd className="text-slate-600">{item.region || "협의 가능"}</dd></div>
                <div className="grid grid-cols-[7rem_1fr] py-2"><dt className="text-[#6f4ab4]">결제 방식</dt><dd className="text-slate-600">안전결제 또는 계좌이체 협의</dd></div>
              </dl>
            </Card>

            <Card className="p-4">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]"><UserRound size={18} /> 판매자 정보</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-[#fbf4ff]"><SafeImage src="/semoduck-profile-duck.png" alt="" kind="profile" className="h-full w-full object-contain" /></div>
                <div><p className="font-black text-[#2f2352]">{profile?.nickname ?? profile?.email ?? "세모덕러"}</p><p className="mt-1 text-xs font-bold text-slate-500">매너 좋은 덕질 거래를 지향해요.</p></div>
              </div>
              <Link href="/market" className="mt-4 inline-flex min-h-8 w-full items-center justify-center rounded-xl bg-white text-xs font-black text-[#6f4ab4] ring-1 ring-[#ead8f4]">판매자의 다른 상품 보기</Link>
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]"><MessageCircle size={20} /> 문의 {inquiries?.length ?? 0}</h2>
            <div className="mt-3 space-y-2">
              {(inquiries ?? []).map((inquiry: any) => {
                const writer = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
                const canEdit = currentUserId === inquiry.user_id;
                return (
                  <div key={inquiry.id} className="relative rounded-2xl bg-[#fbf4ff] p-3">
                    {canEdit ? <InquiryActions inquiryId={inquiry.id} initialContent={inquiry.content} /> : null}
                    <p className="font-black">{writer?.nickname ?? writer?.email ?? "회원"}</p>
                    <p className="mt-2 whitespace-pre-wrap pr-20 text-sm text-slate-700">{inquiry.content}</p>
                    <p className="mt-2 text-xs font-bold text-slate-400">{formatDateTime(inquiry.created_at)}</p>
                  </div>
                );
              })}
              {!(inquiries ?? []).length && <p className="rounded-lg bg-cloud p-4 text-sm font-bold text-slate-500">아직 문의가 없습니다.</p>}
            </div>
            <InquiryForm marketItemId={id} />
          </Card>

          <Card className="flex items-center gap-3 border-[#ffd8aa] bg-[#fff8ef] p-4">
            <AlertTriangle size={20} className="text-[#f09a37]" />
            <p className="text-sm font-bold text-[#6b4b2c]">거래 전 상품 상태와 거래 조건을 꼭 확인해 주세요.</p>
          </Card>
        </div>

        <RelatedPostList title="이 굿즈 관련 게시글" posts={relatedPosts} />
      </div>
    </div>
  );
}
