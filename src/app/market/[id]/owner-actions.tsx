"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tradeStatusLabel } from "@/lib/format";

const statuses = ["active", "reserved", "completed"] as const;

export function MarketOwnerActions({ marketItemId, currentStatus }: { marketItemId: string; currentStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(status: (typeof statuses)[number]) {
    setBusy(status);
    const response = await fetch(`/api/market/${marketItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setBusy(null);
    if (!response.ok) {
      alert("거래 상태를 바꾸지 못했습니다.");
      return;
    }
    router.refresh();
  }

  async function deleteItem() {
    if (!confirm("이 유저거래 글을 삭제할까요?")) return;
    setBusy("delete");
    const response = await fetch(`/api/market/${marketItemId}`, { method: "DELETE" });
    setBusy(null);
    if (!response.ok) {
      alert("글을 삭제하지 못했습니다.");
      return;
    }
    router.push("/market");
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-lg bg-cloud p-4">
      <p className="text-sm font-black text-slate-600">판매자 관리</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Button key={status} variant={currentStatus === status ? "primary" : "secondary"} onClick={() => updateStatus(status)} disabled={busy !== null}>
            {busy === status ? <Loader2 size={15} className="animate-spin" /> : null}
            {tradeStatusLabel(status)}
          </Button>
        ))}
        <Link href={`/market/${marketItemId}/edit`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-slate-200 hover:bg-slate-50">
          수정
        </Link>
        <Button variant="danger" onClick={deleteItem} disabled={busy !== null}>
          {busy === "delete" ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          삭제
        </Button>
      </div>
    </div>
  );
}
