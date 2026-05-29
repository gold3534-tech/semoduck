"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, Heart, Loader2, Pencil, Trash2 } from "lucide-react";
import { ReportButton } from "@/components/report-button";
import { Button } from "@/components/ui/button";

export function PostActions({
  postId,
  initialLikes,
  initialBookmarks,
  initialLiked,
  initialBookmarked,
  isOwner,
  isAdmin = false
}: {
  postId: string;
  initialLikes: number;
  initialBookmarks: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  isOwner: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState<string | null>(null);

  async function readJson(response: Response) {
    const text = await response.text();

    return (text ? JSON.parse(text) : {}) as {
      active?: boolean;
      count?: number;
      error?: string;
    };
  }

  async function toggle(type: "like" | "bookmark") {
    setLoading(type);

    try {
      const response = await fetch(`/api/posts/${postId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });

      const data = await readJson(response);

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
    } catch (error) {
      alert(error instanceof Error ? error.message : "처리하지 못했습니다.");
    } finally {
      setLoading(null);
    }
  }

  async function deletePost() {
    if (!confirm("게시글을 삭제할까요?")) return;

    setLoading("delete");

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        router.push(isOwner ? "/mypage" : "/");
      } else {
        const data = await readJson(response);
        alert(data.error ?? "삭제하지 못했습니다.");
        setLoading(null);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "삭제하지 못했습니다.");
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() => toggle("like")}
        disabled={loading !== null}
        className={liked ? "text-rose-600 ring-rose-200" : ""}
      >
        {loading === "like" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        )}
        좋아요 {likes}
      </Button>

      <Button
        variant="secondary"
        onClick={() => toggle("bookmark")}
        disabled={loading !== null}
        className={bookmarked ? "text-amber-600 ring-amber-200" : ""}
      >
        {loading === "bookmark" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
        )}
        스크랩 {bookmarks}
      </Button>

      {isOwner ? (
        <Button
          variant="secondary"
          onClick={() => router.push(`/posts/${postId}/edit`)}
        >
          <Pencil size={16} />
          수정
        </Button>
      ) : null}

      {isOwner || isAdmin ? (
        <Button variant="danger" onClick={deletePost} disabled={loading !== null}>
          {loading === "delete" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          삭제
        </Button>
      ) : null}

      {!isOwner ? (
        <ReportButton targetType="post" targetId={postId} />
      ) : null}
    </div>
  );
}