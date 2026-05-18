"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EditPostForm({ postId, initialTitle, initialContent }: { postId: string; initialTitle: string; initialContent: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "수정하지 못했습니다.");
      return;
    }
    router.push(`/posts/${postId}`);
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <label className="grid gap-2 text-sm font-black">
        제목
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-12 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" />
      </label>
      <label className="grid gap-2 text-sm font-black">
        본문
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-64 rounded-lg border border-slate-200 p-4 leading-7 outline-none focus:border-berry" />
      </label>
      {message && <p className="rounded-lg bg-pink-50 p-3 text-sm font-bold text-pink-700">{message}</p>}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          저장
        </Button>
      </div>
    </Card>
  );
}
