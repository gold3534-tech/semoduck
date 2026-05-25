import Image from "next/image";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { InquiryActions } from "@/app/market/[id]/inquiry-actions";
import { InquiryForm } from "@/app/market/[id]/inquiry-form";
import { MarketOwnerActions } from "@/app/market/[id]/owner-actions";
import { ReportButton } from "@/components/report-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/auth";
import { formatDateTime, tradeStatusLabel, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: auth } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const currentUserId = auth.user?.id;
  const isAdmin = isAdminEmail(auth.user?.email);

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
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <Card className="h-fit overflow-hidden p-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f7f2fb]">
          {item.image_url ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="288px" /> : null}
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {gallery?.name ? <Badge>{gallery.name}</Badge> : null}
              <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
              <Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status)}</Badge>
            </div>
            {isOwner || isAdmin ? <MarketOwnerActions marketItemId={id} currentStatus={item.status} canEdit={isOwner} /> : null}
          </div>
          <h1 className="mt-3 text-2xl font-black text-[#3a285f] md:text-3xl">{item.title}</h1>
          <p className="mt-2 text-xl font-black text-[#ff5f8d]">{tradeValueLabel(item.trade_type, item.price)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            <span className="rounded-full bg-cloud px-3 py-1">{item.region || "거래 방식 미입력"}</span>
            <span className="rounded-full bg-cloud px-3 py-1">{formatDateTime(item.created_at)}</span>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-500">작성자 {profile?.nickname ?? profile?.email ?? "회원"}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.description}</p>
          {!isOwner ? (
            <div className="mt-5">
              <ReportButton targetType="market_item" targetId={id} />
            </div>
          ) : null}
        </Card>

        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <MessageCircle size={20} /> 문의 {inquiries?.length ?? 0}
          </h2>
          <div className="mt-3 space-y-2">
            {(inquiries ?? []).map((inquiry) => {
              const writer = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
              const canEdit = currentUserId === inquiry.user_id;
              return (
                <div key={inquiry.id} className="relative rounded-2xl bg-[#fbf4ff] p-3">
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
