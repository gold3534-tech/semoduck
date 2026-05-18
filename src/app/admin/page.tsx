"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Flag, ImageIcon, Link2, Loader2, ShieldCheck, Trash2, Upload, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/auth";
import { formatDateTime, sourceLabel } from "@/lib/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  target_id: string;
  category?: string | null;
  detail?: string | null;
  reason?: string | null;
  status: string;
  created_at: string;
  reporter?: { email?: string | null; nickname?: string | null } | null;
  post?: { id: string; title: string; content: string; report_count?: number; is_deleted?: boolean; galleries?: { name?: string | null } | null } | null;
};
type LinkSubmission = { id: string; title: string; url: string; source: string; price?: number | null; is_official: boolean; status: string; created_at: string };
type ProductOffer = { id: string; mall_name: string; url: string; price: number; source: string; is_official: boolean; products?: { title?: string | null } | null };
type Gallery = { id: string; name: string; slug: string; thumbnail_url?: string | null; follower_count: number; post_count: number };
type Dashboard = { reports: Report[]; linkSubmissions: LinkSubmission[]; productOffers: ProductOffer[]; galleries: Gallery[] };
type ProductForm = {
  title: string;
  brand: string;
  category: string;
  description: string;
  imageUrl: string;
  isOfficialProduct: boolean;
  source: "official_shop" | "naver_shopping" | "coupang" | "user_submission" | "internal_market" | "external_search";
  mallName: string;
  price: string;
  shippingFee: string;
  url: string;
  isOfficial: boolean;
  specialBenefit: string;
};

const emptyProductForm: ProductForm = {
  title: "",
  brand: "",
  category: "",
  description: "",
  imageUrl: "",
  isOfficialProduct: false,
  source: "official_shop",
  mallName: "",
  price: "0",
  shippingFee: "0",
  url: "",
  isOfficial: true,
  specialBenefit: ""
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [thumbnailDrafts, setThumbnailDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  async function load() {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
    if (!response.ok) throw new Error("관리자 데이터를 불러오지 못했습니다.");
    setData((await response.json()) as Dashboard);
  }

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: auth }) => {
      const email = auth.user?.email;
      if (!email) {
        router.replace("/login?next=/admin");
        return;
      }
      if (!isAdminEmail(email)) {
        router.replace("/");
        return;
      }
      setReady(true);
      load();
    });
  }, [router]);

  const reportGroups = useMemo(() => {
    const groups = new Map<string, Report[]>();
    for (const report of data?.reports ?? []) {
      if (report.status !== "pending") continue;
      groups.set(report.target_id, [...(groups.get(report.target_id) ?? []), report]);
    }
    return [...groups.entries()].map(([postId, reports]) => ({ postId, reports, post: reports[0]?.post }));
  }, [data]);

  const selectedGroup = reportGroups.find((group) => group.postId === selectedPostId) ?? reportGroups[0];

  async function resolveReport(postId: string, action: "dismiss" | "delete") {
    const response = await fetch(`/api/admin/reports/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (!response.ok) {
      alert("처리하지 못했습니다.");
      return;
    }
    await load();
  }

  async function resolveLinkSubmission(id: string, action: "approve" | "reject") {
    setSavingId(id);
    const response = await fetch(`/api/admin/link-submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSavingId(null);
    if (!response.ok) {
      alert("링크 제보를 처리하지 못했습니다.");
      return;
    }
    await load();
  }

  async function uploadGalleryImage(gallery: Gallery, file: File) {
    setSavingId(gallery.id);
    const form = new FormData();
    form.set("file", file);
    form.set("bucket", "gallery-images");
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const result = (await response.json()) as { url?: string; error?: string };
    setSavingId(null);
    if (!response.ok || !result.url) {
      alert(result.error ?? "이미지를 업로드하지 못했습니다.");
      return;
    }
    setThumbnailDrafts((current) => ({ ...current, [gallery.id]: result.url ?? "" }));
  }

  async function uploadProductImage(file: File) {
    setSavingId("product-image");
    const form = new FormData();
    form.set("file", file);
    form.set("bucket", "product-images");
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const result = (await response.json()) as { url?: string; error?: string };
    setSavingId(null);
    if (!response.ok || !result.url) {
      alert(result.error ?? "상품 이미지를 업로드하지 못했습니다.");
      return;
    }
    setProductForm((current) => ({ ...current, imageUrl: result.url ?? "" }));
  }

  async function createProduct() {
    setSavingId("product");
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: productForm.title,
        brand: productForm.brand,
        category: productForm.category,
        description: productForm.description,
        imageUrl: productForm.imageUrl,
        isOfficialProduct: productForm.isOfficialProduct,
        offer: {
          source: productForm.source,
          mallName: productForm.mallName,
          price: Number(productForm.price || 0),
          shippingFee: Number(productForm.shippingFee || 0),
          url: productForm.url,
          isOfficial: productForm.isOfficial,
          specialBenefit: productForm.specialBenefit
        }
      })
    });
    setSavingId(null);
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "상품을 등록하지 못했습니다.");
      return;
    }
    setProductForm(emptyProductForm);
    await load();
  }

  async function saveThumbnail(gallery: Gallery) {
    const thumbnailUrl = thumbnailDrafts[gallery.id] ?? gallery.thumbnail_url ?? "";
    setSavingId(gallery.id);
    const response = await fetch(`/api/admin/galleries/${gallery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thumbnailUrl })
    });
    setSavingId(null);
    if (!response.ok) {
      alert("대표사진을 저장하지 못했습니다.");
      return;
    }
    await load();
  }

  if (!ready || !data) {
    return (
      <div className="grid min-h-96 place-items-center">
        <Loader2 className="animate-spin text-berry" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-berry">관리자</p>
          <h1 className="mt-2 text-3xl font-black">신고, 상품 링크, 갤러리 대표사진 관리</h1>
        </div>
        <Badge tone="mint">
          <ShieldCheck size={14} /> admin
        </Badge>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><Flag className="text-amber-500" /><p className="mt-3 text-sm font-bold text-slate-500">대기 신고 게시물</p><p className="mt-1 text-3xl font-black">{reportGroups.length}</p></Card>
        <Card><Link2 className="text-mint" /><p className="mt-3 text-sm font-bold text-slate-500">유저 제보 링크</p><p className="mt-1 text-3xl font-black">{data.linkSubmissions.length}</p></Card>
        <Card><ImageIcon className="text-berry" /><p className="mt-3 text-sm font-bold text-slate-500">갤러리</p><p className="mt-1 text-3xl font-black">{data.galleries.length}</p></Card>
      </div>

      <Card>
        <h2 className="text-xl font-black">신고글 관리</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[20rem_1fr]">
          <div className="space-y-2">
            {reportGroups.map((group) => (
              <button key={group.postId} onClick={() => setSelectedPostId(group.postId)} className={`block w-full rounded-lg p-3 text-left font-bold ${selectedGroup?.postId === group.postId ? "bg-pink-50 text-berry" : "bg-cloud"}`}>
                <p className="line-clamp-1">{group.post?.title ?? "삭제된 게시물"}</p>
                <p className="mt-1 text-xs text-slate-500">신고 {group.reports.length}건</p>
              </button>
            ))}
            {!reportGroups.length && <p className="rounded-lg bg-cloud p-3 text-sm font-bold text-slate-500">대기 중인 신고가 없습니다.</p>}
          </div>
          {selectedGroup ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-cloud p-4">
                <p className="text-sm font-black text-berry">{selectedGroup.post?.galleries?.name}</p>
                <h3 className="mt-1 text-lg font-black">{selectedGroup.post?.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedGroup.post?.content}</p>
              </div>
              <div className="space-y-2">
                {selectedGroup.reports.map((report) => (
                  <div key={report.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-black">{report.category ?? "기타"}</p>
                    <p className="mt-1 text-sm text-slate-700">{report.detail ?? report.reason}</p>
                    <p className="mt-2 text-xs font-bold text-slate-400">{report.reporter?.email ?? "알 수 없음"} · {formatDateTime(report.created_at)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => resolveReport(selectedGroup.postId, "dismiss")}><CheckCircle2 size={16} /> 신고 취소</Button>
                <Button variant="danger" onClick={() => resolveReport(selectedGroup.postId, "delete")}><Trash2 size={16} /> 게시글 삭제</Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black">상품/판매 링크 직접 등록</h2>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="상품명" />
            <input value={productForm.brand} onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="브랜드" />
            <input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="카테고리" />
          </div>
          <textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className="min-h-24 rounded-lg border p-3" placeholder="상품 설명" />
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="상품 이미지 URL" />
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold ring-1 ring-slate-200">
              <Upload size={16} />
              이미지 업로드
              <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadProductImage(event.target.files[0])} />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <select value={productForm.source} onChange={(event) => setProductForm({ ...productForm, source: event.target.value as ProductForm["source"] })} className="min-h-10 rounded-lg border px-3">
              <option value="official_shop">공식몰</option>
              <option value="naver_shopping">네이버</option>
              <option value="coupang">쿠팡</option>
              <option value="user_submission">유저 제보</option>
              <option value="external_search">외부 검색</option>
            </select>
            <input value={productForm.mallName} onChange={(event) => setProductForm({ ...productForm, mallName: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="판매처명" />
            <input value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="가격" />
            <input value={productForm.shippingFee} onChange={(event) => setProductForm({ ...productForm, shippingFee: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="배송비" />
          </div>
          <input value={productForm.url} onChange={(event) => setProductForm({ ...productForm, url: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="판매 링크 URL" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-sm font-bold text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={productForm.isOfficialProduct} onChange={(event) => setProductForm({ ...productForm, isOfficialProduct: event.target.checked })} />
                공식 상품
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={productForm.isOfficial} onChange={(event) => setProductForm({ ...productForm, isOfficial: event.target.checked })} />
                공식 판매처
              </label>
            </div>
            <Button onClick={createProduct} disabled={savingId === "product"}>
              {savingId === "product" ? <Loader2 size={16} className="animate-spin" /> : null}
              상품 등록
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black">상품 링크 제보 처리</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {data.linkSubmissions.map((submission) => (
            <div key={submission.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <a href={submission.url} target="_blank" className="font-black hover:text-berry">{submission.title}</a>
                <p className="mt-1 text-sm font-bold text-slate-500">{submission.source} · {submission.status} · {formatDateTime(submission.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => resolveLinkSubmission(submission.id, "approve")} disabled={savingId === submission.id}><CheckCircle2 size={16} /> 승인</Button>
                <Button variant="danger" onClick={() => resolveLinkSubmission(submission.id, "reject")} disabled={savingId === submission.id}><XCircle size={16} /> 거절</Button>
              </div>
            </div>
          ))}
          {!data.linkSubmissions.length && <p className="py-4 text-sm font-bold text-slate-500">대기 중인 제보가 없습니다.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black">등록된 판매 링크</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {data.productOffers.map((offer) => (
            <a key={offer.id} href={offer.url} target="_blank" className="grid gap-2 py-3 text-sm hover:text-berry">
              <p className="font-black">{offer.products?.title ?? offer.mall_name}</p>
              <p className="font-bold text-slate-500">{sourceLabel(offer.source)} · {offer.mall_name} · {offer.price.toLocaleString("ko-KR")}원</p>
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black">갤러리 대표사진 관리</h2>
        <div className="mt-4 grid gap-3">
          {data.galleries.map((gallery) => (
            <div key={gallery.id} className="grid gap-2 rounded-lg bg-cloud p-3 md:grid-cols-[12rem_1fr_auto_auto] md:items-center">
              <p className="font-black">{gallery.name}</p>
              <input value={thumbnailDrafts[gallery.id] ?? gallery.thumbnail_url ?? ""} onChange={(event) => setThumbnailDrafts((current) => ({ ...current, [gallery.id]: event.target.value }))} className="min-h-10 rounded-lg border border-slate-200 px-3" placeholder="대표사진 URL" />
              <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold ring-1 ring-slate-200">
                <Upload size={16} />
                업로드
                <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadGalleryImage(gallery, event.target.files[0])} />
              </label>
              <Button variant="secondary" onClick={() => saveThumbnail(gallery)} disabled={savingId === gallery.id}>저장</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
