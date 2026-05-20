"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const suggestionTypes = [
  ["gallery_request", "갤러리 추가"],
  ["feature_request", "기능 제안"],
  ["bug_report", "오류 제보"],
  ["other", "기타"]
] as const;

export function SuggestionForm() {
  const [type, setType] = useState<(typeof suggestionTypes)[number][0]>("gallery_request");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [galleryName, setGalleryName] = useState("");
  const [gallerySlug, setGallerySlug] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, detail, galleryName, gallerySlug, galleryCategory })
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (response.status === 401) {
      location.href = "/login?next=/suggestions";
      return;
    }
    if (!response.ok) {
      setMessage(data.error ?? "건의를 보내지 못했습니다.");
      return;
    }

    setTitle("");
    setDetail("");
    setGalleryName("");
    setGallerySlug("");
    setGalleryCategory("");
    setMessage("건의를 보냈습니다. 관리자가 확인한 뒤 처리합니다.");
  }

  return (
    <Card className="space-y-4">
      <label className="grid gap-2 text-sm font-black">
        건의 유형
        <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="min-h-11 rounded-lg border border-slate-200 px-3">
          {suggestionTypes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-black">
        제목
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="예: 플레이브 갤러리 추가해주세요" />
      </label>
      {type === "gallery_request" ? (
        <div className="grid gap-3 md:grid-cols-3">
          <input value={galleryName} onChange={(event) => setGalleryName(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="갤러리명" />
          <input value={gallerySlug} onChange={(event) => setGallerySlug(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="영문 주소 예: plave" />
          <input value={galleryCategory} onChange={(event) => setGalleryCategory(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="카테고리" />
        </div>
      ) : null}
      <label className="grid gap-2 text-sm font-black">
        내용
        <textarea value={detail} onChange={(event) => setDetail(event.target.value)} className="min-h-40 rounded-lg border border-slate-200 p-4 leading-7 outline-none focus:border-berry" placeholder="왜 필요한지, 어떤 형태면 좋을지 적어주세요." />
      </label>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={loading || !title || !detail}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          보내기
        </Button>
      </div>
      {message ? <p className="rounded-lg bg-cloud p-3 text-sm font-bold text-slate-600">{message}</p> : null}
    </Card>
  );
}
