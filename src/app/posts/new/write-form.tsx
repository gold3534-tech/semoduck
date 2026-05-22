"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Send, Upload } from "lucide-react";
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
          게시글 유형
          <select value={postType} onChange={(event) => setPostType(event.target.value as PostType)} className="min-h-11 rounded-lg border border-slate-200 px-3">
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
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-56 rounded-lg border border-slate-200 p-4 leading-7 outline-none focus:border-berry" placeholder="내용을 입력하세요" />
      </label>
      <label className="grid gap-2 text-sm font-black">
        태그
        <input value={tagText} onChange={(event) => setTagText(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="쿠로미, 키링, 후기처럼 쉼표로 구분" />
      </label>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-cloud p-6 text-center text-sm font-bold text-slate-500 hover:border-berry">
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
  );
}
