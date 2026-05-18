"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommentActions({ commentId, initialContent }: { commentId: string; initialContent: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const response = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setLoading(false);
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "수정하지 못했습니다.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("댓글을 삭제할까요?")) return;
    setLoading(true);
    const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "삭제하지 못했습니다.");
      return;
    }
    router.refresh();
  }

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-24 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-berry" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            <X size={16} />
            취소
          </Button>
          <Button onClick={save} disabled={loading}>
            저장
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-3 top-3 flex gap-1">
      <button onClick={() => setEditing(true)} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-500 hover:text-ink" title="댓글 수정">
        <Pencil size={15} />
      </button>
      <button onClick={remove} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-rose-500 hover:bg-rose-50" title="댓글 삭제">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
