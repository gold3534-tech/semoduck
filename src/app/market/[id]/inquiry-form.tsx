"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InquiryForm({ marketItemId }: { marketItemId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true);
    const response = await fetch(`/api/market/${marketItemId}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setLoading(false);
    if (response.status === 401) {
      router.push(`/login?next=/market/${marketItemId}`);
      return;
    }
    if (!response.ok) {
      alert("문의를 등록하지 못했습니다.");
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <div className="mt-4 grid gap-2">
      <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-berry" placeholder="상품 상태, 거래 가능 여부 등을 문의해보세요." />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={loading || !content.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          문의 등록
        </Button>
      </div>
    </div>
  );
}
