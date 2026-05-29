"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const categories = [
  "스팸/홍보",
  "사기 의심",
  "욕설/혐오",
  "개인정보 노출",
  "부적절한 거래",
  "기타"
];

export function ReportButton({
  targetType,
  targetId,
  label = "신고"
}: {
  targetType: "post" | "market_item" | "product";
  targetId: string;
  label?: string;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submit() {
    if (!category || !detail.trim()) {
      alert("신고 종류와 상세 내용을 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          category,
          detail
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (response.status === 401) {
        router.push(`/login?next=${location.pathname}`);
        return;
      }

      if (!response.ok) {
        alert(data.error ?? "신고 처리에 실패했습니다.");
        return;
      }

      setReported(true);
      setOpen(false);
      setCategory("");
      setDetail("");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "신고 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/45 p-4">
            <Card className="my-8 w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-rose-500">Report</p>
                  <h2 className="text-xl font-black text-[#3a285f]">
                    신고하기
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 hover:bg-slate-100"
                  aria-label="신고창 닫기"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-rose-300"
                >
                  <option value="">신고 종류 선택</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <textarea
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  className="min-h-32 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-rose-300"
                  placeholder="신고 사유를 구체적으로 적어주세요."
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  취소
                </Button>

                <Button onClick={submit} disabled={loading}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  신고 접수
                </Button>
              </div>
            </Card>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} disabled={reported}>
        <Flag size={16} />
        {reported ? "신고 완료" : label}
      </Button>

      {modal}
    </>
  );
}