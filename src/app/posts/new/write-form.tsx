"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { HelpCircle, ImageIcon, Info, Loader2, PenLine, Send, Sparkles, Upload } from "lucide-react";
import { UploadedImagePreview } from "@/components/uploaded-image-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/domain";

type GalleryOption = { id: string; name: string; slug: string };

const postTypes = [
  ["general", "일반글"],
  ["question", "질문글"],
  ["review", "후기글"],
  ["info", "정보글"]
] as const;

type PostType = (typeof postTypes)[number][0];

function productPrice(product: Product) {
  const prices = product.offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export function WriteForm({ galleries, recommendations }: { galleries: GalleryOption[]; recommendations: Record<string, Product[]> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGallery = searchParams.get("gallery") ?? galleries[0]?.slug ?? "";
  const [gallerySlug, setGallerySlug] = useState(initialGallery);
  const [postType, setPostType] = useState<PostType>("general");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagText, setTagText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"submit" | "image" | "ai" | null>(null);

  const selectedGallery = galleries.find((gallery) => gallery.slug === gallerySlug);
  const recommendedGoods = recommendations[gallerySlug] ?? [];
  const tags = tagText
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);

  async function submitPost() {
    setLoading("submit");
    setMessage("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gallerySlug, postType, title, content, tags, imageUrl })
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (response.status === 401) {
        router.push("/login?next=/posts/new");
        router.refresh();
        return;
      }
      if (!response.ok || !data.id) {
        setMessage(data.error ?? "게시글 등록에 실패했습니다.");
        setLoading(null);
        return;
      }
      router.push(`/posts/${data.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "게시글 등록에 실패했습니다.");
      setLoading(null);
    }
  }

  async function uploadImage(file: File) {
    setLoading("image");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    form.set("bucket", "post-images");
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const data = (await response.json()) as { url?: string; error?: string };
    setLoading(null);
    if (!response.ok || !data.url) {
      setMessage(data.error ?? "이미지 업로드에 실패했습니다.");
      return;
    }
    setImageUrl(data.url);
  }

  async function suggestTags() {
    setLoading("ai");
    setMessage("");
    try {
      const response = await fetch("/api/ai/extract-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      const data = (await response.json()) as { tags?: string[]; product_keywords?: string[] };
      const nextTags = [...(data.tags ?? []), ...(data.product_keywords ?? [])]
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 8);
      if (nextTags.length) {
        setTagText(nextTags.join(", "));
        setMessage("AI가 태그와 굿즈 키워드를 추천했습니다.");
      } else {
        setMessage("추천할 태그를 찾지 못했습니다. 제목과 본문을 조금 더 적어주세요.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 태그 추천에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <Card className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            글을 쓸 갤러리
            <select value={gallerySlug} onChange={(event) => setGallerySlug(event.target.value)} className="min-h-10 rounded-2xl border border-[#ead8f4] px-3 text-sm">
              {galleries.map((gallery) => (
                <option key={gallery.id} value={gallery.slug}>
                  {gallery.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black">
            게시글 유형
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {postTypes.map(([value, label]) => (
                <button key={value} type="button" onClick={() => setPostType(value)} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border px-2 text-xs font-black ${postType === value ? "border-[#a56be8] bg-[#f4e9ff] text-[#7a50bd]" : "border-[#ead8f4] bg-white text-[#4b3a6d]"}`}>
                  {value === "general" ? <PenLine size={15} /> : value === "question" ? <HelpCircle size={15} /> : value === "info" ? <Info size={15} /> : <ImageIcon size={15} />}
                  {label}
                </button>
              ))}
            </div>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-black">
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-10 rounded-2xl border border-[#ead8f4] px-3 text-sm outline-none focus:border-[#b984e7]" placeholder="제목을 입력하세요" />
        </label>
        <label className="grid gap-2 text-sm font-black">
          본문
          <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-40 rounded-2xl border border-[#ead8f4] p-3 text-sm leading-6 outline-none focus:border-[#b984e7]" placeholder="덕질 이야기, 후기, 질문을 적어보세요" />
        </label>
        <label className="grid gap-2 text-sm font-black">
          태그
          <input value={tagText} onChange={(event) => setTagText(event.target.value)} className="min-h-10 rounded-2xl border border-[#ead8f4] px-3 text-sm outline-none focus:border-[#b984e7]" placeholder="쿠로미, 키링, 후기처럼 쉼표로 구분" />
        </label>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={suggestTags} disabled={loading !== null || (!title && !content)} className="min-h-9 rounded-xl px-3 py-1.5 text-xs">
            {loading === "ai" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            AI 태그 추천
          </Button>
        </div>
        <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b984e7] bg-[#fbf4ff] p-4 text-center text-sm font-bold text-slate-500 hover:border-[#ff6f9b]">
          {loading === "image" ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {imageUrl ? "이미지 업로드 완료" : "게시글 이미지 업로드"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])} />
        </label>
        {imageUrl ? <UploadedImagePreview url={imageUrl} onRemove={() => setImageUrl("")} /> : null}
        <div className="flex justify-end">
          <Button type="button" onClick={submitPost} disabled={loading !== null || !gallerySlug || !title || !content}>
            {loading === "submit" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            등록
          </Button>
        </div>
        {message && <p className="rounded-lg bg-pink-50 p-3 text-sm font-bold text-pink-700">{message}</p>}
      </Card>

      <aside className="space-y-3">
        <Card className="bg-gradient-to-br from-[#fff8fb] to-[#fff1f7] p-4">
          <div className="flex items-center gap-2 text-lg font-black text-[#6f4ab4]">글작성 도우미</div>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{selectedGallery?.name ?? "선택한 갤러리"}에 맞는 태그와 굿즈 추천을 함께 보여줘요.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["굿즈", "후기", "정품", "팝업", "예약", "교환"].map((tag) => (
              <button key={tag} type="button" onClick={() => setTagText((current) => (current ? `${current}, ${tag}` : tag))} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#7a50bd] ring-1 ring-[#ead8f4]">
                #{tag}
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-black text-[#ff6f9b]">선택 갤러리 추천 굿즈</h2>
          <div className="mt-3 space-y-2">
            {recommendedGoods.map((product) => (
              <div key={product.id} className="grid grid-cols-[3.75rem_1fr] gap-2 rounded-2xl bg-white p-2 ring-1 ring-[#f1dbe8]">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb]">
                  {product.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <Badge tone="mint">{product.isOfficialProduct ? "공식" : product.category}</Badge>
                  <p className="mt-1 line-clamp-2 text-xs font-black text-[#2f2352]">{product.title}</p>
                  <p className="mt-1 text-xs font-black text-[#ff5f8d]">{productPrice(product) ? formatPrice(productPrice(product)) : "가격 확인"}</p>
                </div>
              </div>
            ))}
            {!recommendedGoods.length && <p className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-500 ring-1 ring-[#f1dbe8]">이 갤러리에 연결된 굿즈가 아직 없습니다.</p>}
          </div>
        </Card>
      </aside>
    </div>
  );
}
