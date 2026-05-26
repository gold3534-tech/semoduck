"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageIcon, Loader2, Send, Upload } from "lucide-react";
import { UploadedImagePreview } from "@/components/uploaded-image-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type GalleryOption = { id: string; name: string; slug: string };
type TradeType = "sell" | "exchange" | "giveaway";

const tradeTypes: Array<{ value: TradeType; label: string; description: string }> = [
  { value: "sell", label: "판매", description: "가격을 정해서 양도해요." },
  { value: "exchange", label: "교환", description: "원하는 굿즈와 바꿔요." },
  { value: "giveaway", label: "나눔", description: "무료로 나눠요." }
];

async function readJsonOrError<T extends { error?: string }>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      error: response.ok ? "서버 응답을 읽지 못했습니다." : `서버 응답 오류 (${response.status})`
    } as T;
  }
}

export function MarketWriteForm({ galleries }: { galleries: GalleryOption[] }) {
  const router = useRouter();
  const [gallerySlug, setGallerySlug] = useState(galleries[0]?.slug ?? "");
  const [tradeType, setTradeType] = useState<TradeType>("sell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [region, setRegion] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"submit" | "image" | null>(null);

  async function uploadImage(file: File) {
    setLoading("image");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    form.set("bucket", "market-images");
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await readJsonOrError<{ url?: string; error?: string }>(response);
    setLoading(null);
    if (!response.ok || !data.url) {
      setMessage(data.error ?? "이미지 업로드에 실패했습니다.");
      return;
    }
    setImageUrl(data.url);
  }

  async function submitMarketItem() {
    setLoading("submit");
    setMessage("");
    try {
      const response = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gallerySlug,
          tradeType,
          title,
          description,
          price: Number(price || 0),
          region,
          imageUrl
        })
      });
      if (response.status === 401) {
        router.push("/login");
        router.refresh();
        return;
      }
      const data = await readJsonOrError<{ id?: string; error?: string }>(response);
      if (!response.ok || !data.id) {
        setMessage(data.error ?? "거래 글 등록에 실패했습니다.");
        setLoading(null);
        return;
      }
      router.push(`/market/${data.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "거래 글 등록에 실패했습니다.");
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <Card className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            갤러리
            <select value={gallerySlug} onChange={(event) => setGallerySlug(event.target.value)} className="min-h-10 rounded-2xl border border-[#ead8f4] px-3 text-sm">
              {galleries.map((gallery) => (
                <option key={gallery.id} value={gallery.slug}>
                  {gallery.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 text-sm font-black">
            거래 유형
            <div className="grid grid-cols-3 gap-2">
              {tradeTypes.map((item) => (
                <button key={item.value} type="button" onClick={() => setTradeType(item.value)} className={`min-h-10 rounded-2xl border px-2 text-xs font-black ${tradeType === item.value ? "border-[#a56be8] bg-[#f4e9ff] text-[#7a50bd]" : "border-[#ead8f4] bg-white text-[#4b3a6d]"}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="grid gap-2 text-sm font-black">
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-10 rounded-2xl border border-[#ead8f4] px-3 text-sm outline-none focus:border-[#b984e7]" placeholder="어떤 굿즈인지 한눈에 보이게 적어주세요" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            가격
            <input value={price} onChange={(event) => setPrice(event.target.value)} className="min-h-10 rounded-2xl border border-[#ead8f4] px-3 text-sm outline-none focus:border-[#b984e7]" placeholder="교환/나눔이면 0" inputMode="numeric" />
          </label>
          <label className="grid gap-2 text-sm font-black">
            지역 또는 거래 방식
            <input value={region} onChange={(event) => setRegion(event.target.value)} className="min-h-10 rounded-2xl border border-[#ead8f4] px-3 text-sm outline-none focus:border-[#b984e7]" placeholder="서울 신촌, 반택, 직거래 등" />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-black">
          설명
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-40 rounded-2xl border border-[#ead8f4] p-3 text-sm leading-6 outline-none focus:border-[#b984e7]" placeholder="상태, 구성품, 하자, 교환 희망 조건을 적어주세요." />
        </label>
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b984e7] bg-[#fbf4ff] p-4 text-center text-sm font-bold text-slate-500 hover:border-[#ff6f9b]">
          {loading === "image" ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {imageUrl ? "이미지 업로드 완료" : "거래 이미지 업로드"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])} />
        </label>
        {imageUrl ? <UploadedImagePreview url={imageUrl} onRemove={() => setImageUrl("")} /> : null}
        <div className="flex justify-end">
          <Button type="button" onClick={submitMarketItem} disabled={loading !== null || !gallerySlug || !title || !description}>
            {loading === "submit" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            등록
          </Button>
        </div>
        {message && <p className="rounded-lg bg-pink-50 p-3 text-sm font-bold text-pink-700">{message}</p>}
      </Card>

      <aside className="space-y-3">
        <Card className="bg-gradient-to-br from-[#fff8fb] to-[#fff1f7] p-4">
          <div className="flex items-center gap-2 text-lg font-black text-[#6f4ab4]">
            <ImageIcon size={18} />
            거래 글 작성
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">실물 사진과 상태를 자세히 적으면 문의가 훨씬 편해져요.</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-black text-[#ff6f9b]">선택한 거래 유형</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{tradeTypes.find((item) => item.value === tradeType)?.description}</p>
        </Card>
      </aside>
    </div>
  );
}
