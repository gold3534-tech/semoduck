"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Send, Sparkles, Tags, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

type GalleryOption = { id: string; name: string; slug: string };
type TagsResponse = { tags: string[]; category: string };
type KeywordResponse = { product_keywords: string[] };
type ExternalSearchResponse = {
  items: Array<{
    id: string;
    title: string;
    mallName: string;
    price: number;
    url: string;
  }>;
};

const postTypes = [
  ["general", "일반글"],
  ["question", "질문글"],
  ["review", "후기글"],
  ["purchase_help", "구매고민글"],
  ["info", "정보글"],
  ["trade", "교환글"],
  ["transfer", "양도글"],
  ["giveaway", "나눔글"]
] as const;

export function WriteForm({ galleries }: { galleries: GalleryOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGallery = searchParams.get("gallery") ?? galleries[0]?.slug ?? "";
  const [gallerySlug, setGallerySlug] = useState(initialGallery);
  const [postType, setPostType] = useState<(typeof postTypes)[number][0]>("purchase_help");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [externalGoods, setExternalGoods] = useState<ExternalSearchResponse["items"]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"tags" | "keywords" | "submit" | null>(null);

  async function recommendTags() {
    setLoading("tags");
    setMessage("");
    const response = await fetch("/api/ai/extract-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = (await response.json()) as TagsResponse;
    setTags(data.tags ?? []);
    setLoading(null);
  }

  async function previewProducts() {
    setLoading("keywords");
    setMessage("");
    const response = await fetch("/api/ai/extract-product-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = (await response.json()) as KeywordResponse;
    setKeywords(data.product_keywords ?? []);
    const firstKeyword = data.product_keywords?.[0] ?? title;
    const searchResponse = await fetch(`/api/products/external-search?q=${encodeURIComponent(firstKeyword)}&display=5`);
    const searchData = (await searchResponse.json()) as ExternalSearchResponse;
    setExternalGoods(searchData.items ?? []);
    setLoading(null);
  }

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
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    form.set("bucket", "post-images");
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setMessage(data.error ?? "이미지 업로드에 실패했습니다.");
      return;
    }
    setImageUrl(data.url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            갤러리
            <select value={gallerySlug} onChange={(event) => setGallerySlug(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3">
              {galleries.map((gallery) => (
                <option key={gallery.id} value={gallery.slug}>
                  {gallery.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black">
            게시글 타입
            <select value={postType} onChange={(event) => setPostType(event.target.value as typeof postType)} className="min-h-11 rounded-lg border border-slate-200 px-3">
              {postTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-black">
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-12 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="제목을 입력하세요" />
        </label>
        <label className="grid gap-2 text-sm font-black">
          본문
          <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-48 rounded-lg border border-slate-200 p-4 leading-7 outline-none focus:border-berry" placeholder="내용을 입력하세요" />
        </label>
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-cloud p-6 text-center text-sm font-bold text-slate-500 hover:border-berry">
          <Upload size={18} />
          {imageUrl ? "이미지 업로드 완료" : "게시글 이미지 업로드"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])} />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={recommendTags} disabled={loading !== null || !title || !content}>
            {loading === "tags" ? <Loader2 size={16} className="animate-spin" /> : <Tags size={16} />}
            AI 태그 추천
          </Button>
          <Button type="button" variant="secondary" onClick={previewProducts} disabled={loading !== null || !title || !content}>
            {loading === "keywords" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            관련 굿즈 미리보기
          </Button>
          <Button type="button" onClick={submitPost} disabled={loading !== null || !gallerySlug || !title || !content}>
            {loading === "submit" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            등록
          </Button>
        </div>
        {message && <p className="rounded-lg bg-pink-50 p-3 text-sm font-bold text-pink-700">{message}</p>}
      </Card>
      <aside className="space-y-4">
        <Card>
          <h2 className="font-black">추천 태그</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(tags.length ? tags : ["AI 버튼을 눌러보세요"]).map((tag) => (
              <Badge key={tag} tone={tags.length ? "pink" : "gray"}>
                #{tag}
              </Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">추출 키워드</h2>
          <div className="mt-3 space-y-2 text-sm font-bold text-slate-600">
            {(keywords.length ? keywords : ["관련 굿즈 미리보기를 실행하면 키워드가 표시됩니다."]).map((keyword) => (
              <p key={keyword}>{keyword}</p>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">관련 굿즈 미리보기</h2>
          <div className="mt-3 space-y-2 text-sm font-bold text-slate-600">
            {externalGoods.map((product) => (
              <a key={product.id} href={product.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-cloud p-3 hover:text-berry">
                {product.title} · {product.mallName} · {formatPrice(product.price)}
              </a>
            ))}
            {!externalGoods.length && <p className="rounded-lg bg-cloud p-3 text-slate-500">아직 미리보기 결과가 없습니다.</p>}
          </div>
        </Card>
      </aside>
    </div>
  );
}
