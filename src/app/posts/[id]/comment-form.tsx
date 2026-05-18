"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitComment() {
    if (!content.trim()) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "댓글 등록에 실패했습니다.");
        setLoading(false);
        return;
      }
      setContent("");
      setLoading(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "댓글 등록에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="min-h-28 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-berry"
        placeholder="댓글을 입력하세요"
      />
      {message && <p className="mt-2 rounded-lg bg-pink-50 p-3 text-sm font-bold text-pink-700">{message}</p>}
      <div className="mt-3 flex justify-end">
        <Button onClick={submitComment} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          댓글 등록
        </Button>
      </div>
    </div>
  );
}
