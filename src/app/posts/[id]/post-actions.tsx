"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, Flag, Heart, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const reportCategories = ["스팸/홍보", "사기 의심", "욕설/혐오", "개인정보 노출", "부적절한 거래", "기타"];

export function PostActions({
  postId,
  initialLikes,
  initialBookmarks,
  initialLiked,
  initialBookmarked,
  isOwner
}: {
  postId: string;
  initialLikes: number;
  initialBookmarks: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reported, setReported] = useState(false);

  async function toggle(type: "like" | "bookmark") {
    setLoading(type);
    const response = await fetch(`/api/posts/${postId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });
    const data = (await response.json()) as { active?: boolean; count?: number; error?: string };
    if (response.ok && typeof data.count === "number") {
      if (type === "like") {
        setLikes(data.count);
        setLiked(Boolean(data.active));
      } else {
        setBookmarks(data.count);
        setBookmarked(Boolean(data.active));
      }
    } else if (response.status === 401) {
      router.push(`/login?next=/posts/${postId}`);
    } else {
      alert(data.error ?? "처리하지 못했습니다.");
    }
    setLoading(null);
    router.refresh();
  }

  async function submitReport() {
    if (!reportCategory || !reportDetail.trim()) {
      alert("신고 종류와 상세 내용을 모두 입력해주세요.");
      return;
    }
    setLoading("report");
    const response = await fetch(`/api/posts/${postId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: reportCategory, detail: reportDetail })
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; autoDeleted?: boolean };
    if (response.status === 401) router.push(`/login?next=/posts/${postId}`);
    else if (response.ok) {
      setReported(true);
      setReportOpen(false);
      alert(data.autoDeleted ? "신고가 접수되었고 누적 신고 기준으로 게시물이 삭제되었습니다." : "신고가 접수되었습니다.");
      router.refresh();
    } else {
      alert(data.error ?? "신고 처리에 실패했습니다.");
    }
    setLoading(null);
  }

  async function deletePost() {
    if (!confirm("게시글을 삭제할까요?")) return;
    setLoading("delete");
    const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (response.ok) router.push("/mypage");
    else {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "삭제하지 못했습니다.");
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toggle("like")} disabled={loading !== null} className={liked ? "text-rose-600 ring-rose-200" : ""}>
        {loading === "like" ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} fill={liked ? "currentColor" : "none"} />}
        좋아요 {likes}
      </Button>
      <Button variant="secondary" onClick={() => toggle("bookmark")} disabled={loading !== null} className={bookmarked ? "text-amber-600 ring-amber-200" : ""}>
        {loading === "bookmark" ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />}
        스크랩 {bookmarks}
      </Button>
      {isOwner ? (
        <>
          <Button variant="secondary" onClick={() => router.push(`/posts/${postId}/edit`)}>
            <Pencil size={16} />
            수정
          </Button>
          <Button variant="danger" onClick={deletePost} disabled={loading !== null}>
            {loading === "delete" ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            삭제
          </Button>
        </>
      ) : (
        <Button variant="ghost" onClick={() => setReportOpen(true)} disabled={loading !== null || reported}>
          {loading === "report" ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
          {reported ? "신고 완료" : "신고"}
        </Button>
      )}

      {reportOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">게시글 신고</h2>
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <select value={reportCategory} onChange={(event) => setReportCategory(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3">
                <option value="">신고 종류 선택</option>
                {reportCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <textarea
                value={reportDetail}
                onChange={(event) => setReportDetail(event.target.value)}
                className="min-h-32 rounded-lg border border-slate-200 p-3"
                placeholder="신고 사유를 구체적으로 적어주세요."
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReportOpen(false)}>취소</Button>
              <Button onClick={submitReport} disabled={loading === "report"}>
                {loading === "report" ? <Loader2 size={16} className="animate-spin" /> : null}
                신고 접수
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
