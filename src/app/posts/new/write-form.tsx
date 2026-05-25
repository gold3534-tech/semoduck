"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { HelpCircle, ImageIcon, Info, Loader2, PenLine, Send, Upload } from "lucide-react";
import { UploadedImagePreview } from "@/components/uploaded-image-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type GalleryOption = { id: string; name: string; slug: string };

const postTypes = [
  ["general", "일반글"],
  ["question", "질문글"],
  ["review", "후기글"],
  ["info", "정보글"]
] as const;

type PostType = (typeof postTypes)[number][0];

export function WriteForm({ galleries }: { galleries: GalleryOption[] }) {
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
  const [loading, setLoading] = useState<"submit" | "image" | null>(null);

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
    <Card className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-black">
          갤러리
          <select value={gallerySlug} onChange={(event) => setGallerySlug(event.target.value)} className="min-h-12 rounded-2xl border border-[#ead8f4] px-4">
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
              <button key={value} type="button" onClick={() => setPostType(value)} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black ${postType === value ? "border-[#a56be8] bg-[#f4e9ff] text-[#7a50bd]" : "border-[#ead8f4] bg-white text-[#4b3a6d]"}`}>
                {value === "general" ? <PenLine size={16} /> : value === "question" ? <HelpCircle size={16} /> : value === "info" ? <Info size={16} /> : <ImageIcon size={16} />}
                {label}
              </button>
            ))}
          </div>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-black">
        제목
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-12 rounded-2xl border border-[#ead8f4] px-4 outline-none focus:border-[#b984e7]" placeholder="제목을 입력하세요" />
      </label>
      <label className="grid gap-2 text-sm font-black">
        본문
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-56 rounded-2xl border border-[#ead8f4] p-4 leading-7 outline-none focus:border-[#b984e7]" placeholder="내용을 입력하세요" />
      </label>
      <label className="grid gap-2 text-sm font-black">
        태그
        <input value={tagText} onChange={(event) => setTagText(event.target.value)} className="min-h-12 rounded-2xl border border-[#ead8f4] px-4 outline-none focus:border-[#b984e7]" placeholder="쿠로미, 키링, 후기처럼 쉼표로 구분" />
      </label>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b984e7] bg-[#fbf4ff] p-6 text-center text-sm font-bold text-slate-500 hover:border-[#ff6f9b]">
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
    <aside className="space-y-4">
      <Card className="bg-gradient-to-br from-[#fff8fb] to-[#fff1f7]">
        <div className="flex items-center gap-2 text-lg font-black text-[#6f4ab4]">✨ 작성 도우미</div>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">태그를 쉼표로 입력하면 게시글 상세에서 관련 굿즈 추천에 활용됩니다.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["굿즈", "후기", "정품", "팝업", "예약", "교환"].map((tag) => (
            <button key={tag} type="button" onClick={() => setTagText((current) => current ? `${current}, ${tag}` : tag)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#7a50bd] ring-1 ring-[#ead8f4]">
              #{tag}
            </button>
          ))}
        </div>
      </Card>
    </aside>
    </div>
  );
}
