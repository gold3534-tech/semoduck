"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";

export function InquiryActions({ inquiryId, initialContent }: { inquiryId: string; initialContent: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const response = await fetch(`/api/market/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setBusy(false);
    if (!response.ok) {
      alert("문의를 수정하지 못했습니다.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("이 문의를 삭제할까요?")) return;
    setBusy(true);
    const response = await fetch(`/api/market/inquiries/${inquiryId}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      alert("문의를 삭제하지 못했습니다.");
      return;
    }
    router.refresh();
  }

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm" />
        <div className="flex justify-end gap-2">
          <button className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200" onClick={() => setEditing(false)} disabled={busy}>
            취소
          </button>
          <button className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-2 text-xs font-black text-white" onClick={save} disabled={busy || content.trim().length < 2}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : null}
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-3 top-3 flex gap-1">
      <button className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 hover:text-ink" onClick={() => setEditing(true)} title="수정" disabled={busy}>
        <Pencil size={14} />
      </button>
      <button className="grid h-8 w-8 place-items-center rounded-lg bg-white text-rose-500 ring-1 ring-slate-200 hover:bg-rose-50" onClick={remove} title="삭제" disabled={busy}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}
