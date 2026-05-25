"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, Plus, Upload } from "lucide-react";
import { UploadedImagePreview } from "@/components/uploaded-image-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, tradeStatusLabel, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import type { Gallery } from "@/types/domain";

type TradeType = "sell" | "exchange" | "giveaway";
type MarketItem = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  trade_type: TradeType;
  status: "active" | "reserved" | "completed" | "hidden" | "reported";
  price: number;
  region: string | null;
  image_url: string | null;
  created_at: string;
  profiles?: { nickname?: string | null; email?: string | null } | null;
  galleries?: { name?: string | null; slug?: string | null } | null;
};

type FormState = {
  id?: string;
  gallerySlug: string;
  tradeType: TradeType;
  title: string;
  description: string;
  price: string;
  region: string;
  imageUrl: string;
  status: "active" | "reserved" | "completed" | "hidden";
};

const emptyForm = (gallerySlug = ""): FormState => ({
  gallerySlug,
  tradeType: "sell",
  title: "",
  description: "",
  price: "0",
  region: "",
  imageUrl: "",
  status: "active"
});

const filters = ["전체", "판매", "교환", "나눔", "거래 가능", "예약중", "거래완료"];

export function MarketBoard({
  initialItems,
  galleries,
  currentUserId,
  isAdmin
}: {
  initialItems: MarketItem[];
  galleries: Gallery[];
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState("전체");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(galleries[0]?.slug ?? ""));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "전체") return items;
    return items.filter((item) => tradeTypeLabel(item.trade_type) === filter || tradeStatusLabel(item.status) === filter);
  }, [filter, items]);

  async function reload() {
    const response = await fetch("/api/market", { cache: "no-store" });
    const data = (await response.json()) as { items?: MarketItem[] };
    setItems(data.items ?? []);
  }

  async function upload(file: File) {
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    data.set("bucket", "market-images");
    const response = await fetch("/api/uploads", { method: "POST", body: data });
    const result = (await response.json()) as { url?: string; error?: string };
    setUploading(false);
    if (!response.ok || !result.url) {
      alert(result.error ?? "이미지 업로드에 실패했습니다.");
      return;
    }
    setForm((current) => ({ ...current, imageUrl: result.url ?? "" }));
  }

  async function submit() {
    setSaving(true);
    const response = await fetch(form.id ? `/api/market/${form.id}` : "/api/market", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gallerySlug: form.gallerySlug,
        tradeType: form.tradeType,
        title: form.title,
        description: form.description,
        price: Number(form.price || 0),
        region: form.region,
        imageUrl: form.imageUrl,
        status: form.status
      })
    });
    setSaving(false);
    if (response.status === 401) {
      location.href = "/login?next=/market";
      return;
    }
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "저장하지 못했습니다.");
      return;
    }
    setFormOpen(false);
    setForm(emptyForm(galleries[0]?.slug ?? ""));
    await reload();
  }

  function closeForm() {
    setFormOpen(false);
    setForm(emptyForm(galleries[0]?.slug ?? ""));
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-black ${filter === item ? "bg-[#ff6f9b] text-white" : "bg-white text-[#4b3a6d] ring-1 ring-[#ead8f4] hover:bg-[#fff1f7]"}`}>
              {item}
            </button>
          ))}
        </div>
        <Button onClick={() => setFormOpen((open) => !open)}>
          <Plus size={16} />
          거래 글쓰기
        </Button>
      </Card>

      {formOpen ? (
        <Card className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <select value={form.gallerySlug} onChange={(event) => setForm({ ...form, gallerySlug: event.target.value })} className="min-h-11 rounded-2xl border border-[#ead8f4] px-3">
              {galleries.map((gallery) => <option key={gallery.slug} value={gallery.slug}>{gallery.name}</option>)}
            </select>
            <select value={form.tradeType} onChange={(event) => setForm({ ...form, tradeType: event.target.value as TradeType })} className="min-h-11 rounded-2xl border border-[#ead8f4] px-3">
              <option value="sell">판매</option>
              <option value="exchange">교환</option>
              <option value="giveaway">나눔</option>
            </select>
            <input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="min-h-11 rounded-2xl border border-[#ead8f4] px-3" placeholder="가격" />
          </div>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="min-h-11 rounded-2xl border border-[#ead8f4] px-3" placeholder="제목" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-28 rounded-2xl border border-[#ead8f4] p-3" placeholder="설명" />
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} className="min-h-11 rounded-2xl border border-[#ead8f4] px-3" placeholder="지역 또는 거래 방식" />
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black ring-1 ring-[#ead8f4]">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              이미지 업로드
              <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
            </label>
          </div>
          {form.imageUrl ? <UploadedImagePreview url={form.imageUrl} onRemove={() => setForm((current) => ({ ...current, imageUrl: "" }))} /> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeForm}>취소</Button>
            <Button onClick={submit} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : null} 저장</Button>
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        {filtered.map((item) => (
            <Card key={item.id} className="grid gap-5 overflow-hidden p-4 md:grid-cols-[15rem_1fr_auto] md:items-center">
              <Link href={`/market/${item.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f7f2fb]">
                  {item.image_url ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="240px" /> : null}
                </div>
              </Link>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {item.galleries?.name ? <Badge>{item.galleries.name}</Badge> : null}
                  <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
                  <Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status)}</Badge>
                </div>
                <Link href={`/market/${item.id}`} className="block text-xl font-black text-[#2f2352] hover:text-[#ff6f9b]">{item.title}</Link>
                <p className="text-2xl font-black text-[#ff5f8d]">{tradeValueLabel(item.trade_type, item.price)}</p>
                <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-500">
                  <span className="rounded-full bg-cloud px-3 py-1">{item.region || "거래 방식 미입력"}</span>
                  <span className="rounded-full bg-cloud px-3 py-1">{formatDateTime(item.created_at)}</span>
                </div>
                <p className="text-sm font-bold text-slate-500">작성자 {item.profiles?.nickname ?? item.profiles?.email ?? "회원"}</p>
                <p className="line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
              <Link href={`/market/${item.id}`} className="hidden text-[#8b61c8] md:block">›</Link>
            </Card>
        ))}
      </div>
    </div>
  );
}
