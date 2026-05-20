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

type TargetType = "post" | "market_item" | "product";
type ReportTarget = {
  id: string;
  title?: string | null;
  content?: string | null;
  description?: string | null;
  report_count?: number | null;
  galleries?: { name?: string | null } | null;
};
type Report = {
  id: string;
  target_type: TargetType;
  target_id: string;
  category?: string | null;
  detail?: string | null;
  reason?: string | null;
  status: string;
  created_at: string;
  reporter?: { email?: string | null; nickname?: string | null } | null;
  target?: ReportTarget | null;
};
type LinkSubmission = { id: string; title: string; url: string; source: string; price?: number | null; is_official: boolean; status: string; created_at: string };
type ProductOffer = { id: string; mall_name: string; url: string; price: number; source: string; is_official: boolean; products?: { title?: string | null } | null };
type Gallery = { id: string; name: string; slug: string; thumbnail_url?: string | null; follower_count: number; post_count: number };
type ProductRow = { id: string; title: string; category?: string | null; brand?: string | null; image_url?: string | null; report_count?: number | null };
type Suggestion = {
  id: string;
  type: string;
  title: string;
  detail: string;
  requested_gallery_name?: string | null;
  requested_gallery_slug?: string | null;
  requested_gallery_category?: string | null;
  status: string;
  created_at: string;
  user?: { email?: string | null; nickname?: string | null } | null;
};
type Dashboard = { reports: Report[]; linkSubmissions: LinkSubmission[]; productOffers: ProductOffer[]; galleries: Gallery[]; products: ProductRow[]; suggestions: Suggestion[] };
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

const emptyGalleryForm = {
  name: "",
  slug: "",
  category: "",
  description: "",
  thumbnailUrl: ""
};

const targetLabels: Record<TargetType, string> = {
  post: "게시글",
  market_item: "유저거래글",
  product: "상품"
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [thumbnailDrafts, setThumbnailDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);

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
      const key = `${report.target_type}:${report.target_id}`;
      groups.set(key, [...(groups.get(key) ?? []), report]);
    }
    return [...groups.entries()].map(([key, reports]) => ({ key, reports, targetType: reports[0].target_type, targetId: reports[0].target_id, target: reports[0].target }));
  }, [data]);

  const selectedGroup = reportGroups.find((group) => group.key === selectedKey) ?? reportGroups[0];

  async function resolveReport(targetType: TargetType, targetId: string, action: "dismiss" | "delete") {
    const response = await fetch("/api/admin/reports/resolve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, action })
    });
    if (!response.ok) {
      alert("신고를 처리하지 못했습니다.");
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
      const error = (await response.json()) as { error?: string };
      alert(error.error ?? "상품을 등록하지 못했습니다.");
      return;
    }
    setProductForm(emptyProductForm);
    await load();
  }

  async function createGallery(fromSuggestion?: Suggestion) {
    const form = fromSuggestion
      ? {
          name: fromSuggestion.requested_gallery_name || galleryForm.name,
          slug: fromSuggestion.requested_gallery_slug || galleryForm.slug,
          category: fromSuggestion.requested_gallery_category || galleryForm.category || "기타",
          description: fromSuggestion.detail || galleryForm.description,
          thumbnailUrl: galleryForm.thumbnailUrl
        }
      : galleryForm;

    setSavingId(fromSuggestion ? `gallery-${fromSuggestion.id}` : "gallery");
    const response = await fetch("/api/admin/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (response.ok && fromSuggestion) {
      await resolveSuggestion(fromSuggestion.id, "resolve", "갤러리 추가 완료");
    }
    setSavingId(null);
    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      alert(error.error ?? "갤러리를 추가하지 못했습니다.");
      return;
    }
    setGalleryForm(emptyGalleryForm);
    await load();
  }

  async function resolveSuggestion(id: string, action: "resolve" | "reject", adminNote = "") {
    setSavingId(`suggestion-${id}`);
    const response = await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote })
    });
    setSavingId(null);
    if (!response.ok) {
      alert("건의를 처리하지 못했습니다.");
      return;
    }
    await load();
  }

  async function deleteProduct(productId: string) {
    if (!confirm("이 상품을 삭제할까요?")) return;
    setSavingId(productId);
    const response = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setSavingId(null);
    if (!response.ok) {
      alert("상품을 삭제하지 못했습니다.");
      return;
    }
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card><Flag className="text-amber-500" /><p className="mt-3 text-sm font-bold text-slate-500">대기 신고</p><p className="mt-1 text-3xl font-black">{reportGroups.length}</p></Card>
        <Card><Link2 className="text-mint" /><p className="mt-3 text-sm font-bold text-slate-500">유저 제보 링크</p><p className="mt-1 text-3xl font-black">{data.linkSubmissions.length}</p></Card>
        <Card><ImageIcon className="text-berry" /><p className="mt-3 text-sm font-bold text-slate-500">갤러리</p><p className="mt-1 text-3xl font-black">{data.galleries.length}</p></Card>
        <Card><Trash2 className="text-rose-500" /><p className="mt-3 text-sm font-bold text-slate-500">등록 상품</p><p className="mt-1 text-3xl font-black">{data.products.length}</p></Card>
      </div>

      <Card>
        <h2 className="text-xl font-black">유저 건의 처리</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {(data.suggestions ?? []).map((suggestion) => (
            <div key={suggestion.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={suggestion.status === "pending" ? "sun" : "gray"}>{suggestion.status}</Badge>
                  <Badge tone="mint">{suggestion.type === "gallery_request" ? "갤러리 추가" : suggestion.type}</Badge>
                </div>
                <p className="mt-2 font-black">{suggestion.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{suggestion.detail}</p>
                {suggestion.requested_gallery_name ? (
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    요청 갤러리: {suggestion.requested_gallery_name} / {suggestion.requested_gallery_slug || "slug 미입력"} / {suggestion.requested_gallery_category || "카테고리 미입력"}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-bold text-slate-400">{suggestion.user?.email ?? "알 수 없음"} · {formatDateTime(suggestion.created_at)}</p>
              </div>
              {suggestion.status === "pending" ? (
                <div className="flex flex-wrap gap-2">
                  {suggestion.type === "gallery_request" ? (
                    <Button variant="secondary" onClick={() => createGallery(suggestion)} disabled={savingId === `gallery-${suggestion.id}`}>
                      {savingId === `gallery-${suggestion.id}` ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      갤러리 추가
                    </Button>
                  ) : null}
                  <Button variant="secondary" onClick={() => resolveSuggestion(suggestion.id, "resolve", "확인 완료")} disabled={savingId === `suggestion-${suggestion.id}`}>처리 완료</Button>
                  <Button variant="danger" onClick={() => resolveSuggestion(suggestion.id, "reject", "반려")} disabled={savingId === `suggestion-${suggestion.id}`}>반려</Button>
                </div>
              ) : null}
            </div>
          ))}
          {!(data.suggestions ?? []).length && <p className="py-4 text-sm font-bold text-slate-500">아직 들어온 건의가 없습니다.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black">갤러리 직접 추가</h2>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input value={galleryForm.name} onChange={(event) => setGalleryForm({ ...galleryForm, name: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="갤러리명" />
            <input value={galleryForm.slug} onChange={(event) => setGalleryForm({ ...galleryForm, slug: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="영문 주소" />
            <input value={galleryForm.category} onChange={(event) => setGalleryForm({ ...galleryForm, category: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="카테고리" />
          </div>
          <textarea value={galleryForm.description} onChange={(event) => setGalleryForm({ ...galleryForm, description: event.target.value })} className="min-h-20 rounded-lg border p-3" placeholder="갤러리 설명" />
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={galleryForm.thumbnailUrl} onChange={(event) => setGalleryForm({ ...galleryForm, thumbnailUrl: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="대표 이미지 URL" />
            <Button onClick={() => createGallery()} disabled={savingId === "gallery" || !galleryForm.name || !galleryForm.slug || !galleryForm.category || !galleryForm.description}>
              {savingId === "gallery" ? <Loader2 size={16} className="animate-spin" /> : null}
              갤러리 추가
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black">신고 관리</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="space-y-2">
            {reportGroups.map((group) => (
              <button key={group.key} onClick={() => setSelectedKey(group.key)} className={`block w-full rounded-lg p-3 text-left font-bold ${selectedGroup?.key === group.key ? "bg-pink-50 text-berry" : "bg-cloud"}`}>
                <Badge tone={group.targetType === "product" ? "sun" : group.targetType === "market_item" ? "mint" : "pink"}>{targetLabels[group.targetType]}</Badge>
                <p className="mt-2 line-clamp-1">{group.target?.title ?? "삭제되었거나 찾을 수 없는 대상"}</p>
                <p className="mt-1 text-xs text-slate-500">신고 {group.reports.length}건</p>
              </button>
            ))}
            {!reportGroups.length && <p className="rounded-lg bg-cloud p-3 text-sm font-bold text-slate-500">대기 중인 신고가 없습니다.</p>}
          </div>
          {selectedGroup ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-cloud p-4">
                <Badge>{targetLabels[selectedGroup.targetType]}</Badge>
                <h3 className="mt-2 text-lg font-black">{selectedGroup.target?.title ?? "대상 없음"}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedGroup.target?.content ?? selectedGroup.target?.description ?? ""}</p>
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
                <Button variant="secondary" onClick={() => resolveReport(selectedGroup.targetType, selectedGroup.targetId, "dismiss")}><CheckCircle2 size={16} /> 신고 취소</Button>
                <Button variant="danger" onClick={() => resolveReport(selectedGroup.targetType, selectedGroup.targetId, "delete")}><Trash2 size={16} /> 대상 삭제</Button>
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
              <Upload size={16} /> 이미지 업로드
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
        <h2 className="text-xl font-black">등록 상품 삭제</h2>
        <p className="mt-1 text-sm font-bold text-slate-500">관리자는 상품을 수정하지 않고 삭제만 할 수 있습니다.</p>
        <div className="mt-4 divide-y divide-slate-100">
          {data.products.map((product) => (
            <div key={product.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-black">{product.title}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{product.brand || "브랜드 없음"} · {product.category || "카테고리 없음"} · 신고 {product.report_count ?? 0}건</p>
              </div>
              <Button variant="danger" onClick={() => deleteProduct(product.id)} disabled={savingId === product.id}>
                {savingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                삭제
              </Button>
            </div>
          ))}
          {!data.products.length && <p className="py-4 text-sm font-bold text-slate-500">등록된 상품이 없습니다.</p>}
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
                <Upload size={16} /> 업로드
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
