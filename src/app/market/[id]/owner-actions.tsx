"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-1.5">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => updateStatus(status)}
            disabled={busy !== null}
            className={`min-h-8 rounded-lg px-3 text-xs font-black transition ${currentStatus === status ? "bg-ink text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {busy === status ? <Loader2 size={13} className="inline animate-spin" /> : tradeStatusLabel(status)}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-1.5">
        <Link href={`/market/${marketItemId}/edit`} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50" title="수정">
          <Pencil size={14} />
        </Link>
        <button onClick={deleteItem} disabled={busy !== null} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500 text-white hover:bg-rose-600" title="삭제">
          {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}
