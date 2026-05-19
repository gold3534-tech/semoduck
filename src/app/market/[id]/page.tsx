import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { InquiryActions } from "@/app/market/[id]/inquiry-actions";
import { InquiryForm } from "@/app/market/[id]/inquiry-form";
import { MarketOwnerActions } from "@/app/market/[id]/owner-actions";
import { ReportButton } from "@/components/report-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, tradeStatusLabel, tradeTypeLabel } from "@/lib/format";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: auth } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const currentUserId = auth.user?.id;

  const [{ data: item }, { data: inquiries }] = await Promise.all([
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

  if (!item) notFound();

  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const gallery = Array.isArray(item.galleries) ? item.galleries[0] : item.galleries;
  const isOwner = currentUserId === item.seller_id;

  return (
    <div className="grid gap-6 lg:grid-cols-[28rem_1fr]">
      <Card className="h-fit">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
          {item.image_url ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="448px" /> : null}
        </div>
      </Card>
      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap gap-2">
            <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
            <Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status)}</Badge>
            {gallery?.name ? <Badge>{gallery.name}</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-black">{item.title}</h1>
          <p className="mt-3 text-2xl font-black">{formatPrice(item.price)}</p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {profile?.nickname ?? profile?.email ?? "회원"} · {item.region || "지역 미입력"} · {formatDateTime(item.created_at)}
          </p>
          <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{item.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button>
              <MessageCircle size={16} /> 문의하기
            </Button>
            {!isOwner ? <ReportButton targetType="market_item" targetId={id} /> : null}
            {gallery?.slug ? (
              <Link href={`/galleries/${gallery.slug}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-ink ring-1 ring-slate-200">
                갤러리 보기
              </Link>
            ) : null}
          </div>
          {isOwner ? <MarketOwnerActions marketItemId={id} currentStatus={item.status} /> : null}
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <MessageCircle size={20} /> 문의 {inquiries?.length ?? 0}
          </h2>
          <div className="mt-4 space-y-3">
            {(inquiries ?? []).map((inquiry) => {
              const writer = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
              const canEdit = currentUserId === inquiry.user_id;
              return (
                <div key={inquiry.id} className="relative rounded-lg bg-cloud p-4">
                  {canEdit ? <InquiryActions inquiryId={inquiry.id} initialContent={inquiry.content} /> : null}
                  <p className="font-black">{writer?.nickname ?? writer?.email ?? "회원"}</p>
                  <p className="mt-2 whitespace-pre-wrap pr-20 text-slate-700">{inquiry.content}</p>
                  <p className="mt-2 text-xs font-bold text-slate-400">{formatDateTime(inquiry.created_at)}</p>
                </div>
              );
            })}
            {!(inquiries ?? []).length && <p className="rounded-lg bg-cloud p-4 text-sm font-bold text-slate-500">아직 문의가 없습니다.</p>}
          </div>
          <InquiryForm marketItemId={id} />
        </Card>
      </div>
    </div>
  );
}
