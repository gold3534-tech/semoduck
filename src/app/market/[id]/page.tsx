import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { InquiryForm } from "@/app/market/[id]/inquiry-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, tradeStatusLabel, tradeTypeLabel } from "@/lib/format";
import { createDataSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createDataSupabaseClient();
  const [{ data: item }, { data: inquiries }] = await Promise.all([
    supabase.from("market_items").select("id,title,description,trade_type,status,price,region,image_url,created_at,profiles(nickname,email),galleries(name,slug)").eq("id", id).neq("trade_type", "transfer").neq("status", "hidden").single(),
    supabase.from("market_inquiries").select("id,content,created_at,profiles(nickname,email)").eq("market_item_id", id).eq("is_deleted", false).order("created_at", { ascending: true })
  ]);
  if (!item) notFound();
  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const gallery = Array.isArray(item.galleries) ? item.galleries[0] : item.galleries;
  return <div className="grid gap-6 lg:grid-cols-[28rem_1fr]"><Card className="h-fit"><div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">{item.image_url ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="448px" /> : null}</div></Card><div className="space-y-5"><Card><div className="flex flex-wrap gap-2"><Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge><Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status)}</Badge>{gallery?.name ? <Badge>{gallery.name}</Badge> : null}</div><h1 className="mt-3 text-3xl font-black">{item.title}</h1><p className="mt-3 text-2xl font-black">{formatPrice(item.price)}</p><p className="mt-2 text-sm font-bold text-slate-500">{profile?.nickname ?? profile?.email ?? "회원"} · {item.region || "지역 미입력"} · {formatDateTime(item.created_at)}</p><p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{item.description}</p><div className="mt-5 flex flex-wrap gap-2"><Button><MessageCircle size={16} /> 문의하기</Button>{gallery?.slug ? <Link href={`/galleries/${gallery.slug}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-ink ring-1 ring-slate-200">갤러리 보기</Link> : null}</div></Card><Card><h2 className="flex items-center gap-2 text-xl font-black"><MessageCircle size={20} /> 문의 {inquiries?.length ?? 0}</h2><div className="mt-4 space-y-3">{(inquiries ?? []).map((inquiry) => { const writer = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles; return <div key={inquiry.id} className="rounded-lg bg-cloud p-4"><p className="font-black">{writer?.nickname ?? writer?.email ?? "회원"}</p><p className="mt-2 text-slate-700">{inquiry.content}</p><p className="mt-2 text-xs font-bold text-slate-400">{formatDateTime(inquiry.created_at)}</p></div>; })}{!(inquiries ?? []).length && <p className="rounded-lg bg-cloud p-4 text-sm font-bold text-slate-500">아직 문의가 없습니다.</p>}</div><InquiryForm marketItemId={id} /></Card></div></div>;
}
