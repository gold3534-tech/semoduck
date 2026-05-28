"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, ImageIcon, Link2, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/auth";
import { formatDateTime, sourceLabel } from "@/lib/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type TargetType = "post" | "market_item" | "product";
type ReportTarget = { id: string; title?: string | null; content?: string | null; description?: string | null };
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
type ProductOffer = { id: string; mall_name: string; url: string; price: number; source: string; products?: { title?: string | null } | null };
type Gallery = { id: string; name: string; slug: string; thumbnail_url?: string | null; follower_count: number; post_count: number };
type ProductRow = { id: string; title: string; category?: string | null; brand?: string | null; report_count?: number | null };
type OfficialProductCandidate = {
  key: string;
  gallerySlug: string;
  title: string;
  brand: string;
  category: string;
  description?: string;
  imageUrl?: string;
  mallName: string;
  price?: number;
  shippingFee?: number;
  url: string;
  source?: "official_shop" | "naver_shopping";
  availabilityLabel?: string;
};
type Suggestion = {
  id: string;
  type: string;
  title: string;
  detail: string;
  requested_gallery_name?: string | null;
  requested_gallery_category?: string | null;
  status: string;
  created_at: string;
  user?: { email?: string | null; nickname?: string | null } | null;
};
type Dashboard = {
  reports: Report[];
  productOffers: ProductOffer[];
  galleries: Gallery[];
  products: ProductRow[];
  suggestions: Suggestion[];
  suggestionSetupMissing?: boolean;
};
type ProductForm = {
  title: string;
  brand: string;
  category: string;
  description: string;
  imageUrl: string;
  source: "official_shop" | "naver_shopping" | "coupang" | "user_submission" | "internal_market" | "external_search";
  mallName: string;
  price: string;
  shippingFee: string;
  url: string;
  specialBenefit: string;
};

const targetLabels: Record<TargetType, string> = {
  post: "게시글",
  market_item: "유저거래글",
  product: "상품"
};

const tabs = [
  ["suggestions", "건의/갤러리"],
  ["reports", "신고"],
  ["products", "상품/링크"],
  ["galleries", "갤러리"]
] as const;

const emptyProductForm: ProductForm = {
  title: "",
  brand: "",
  category: "",
  description: "",
  imageUrl: "",
  source: "official_shop",
  mallName: "",
  price: "0",
  shippingFee: "0",
  url: "",
  specialBenefit: ""
};

const emptyGalleryForm = {
  name: "",
  slug: "",
  category: "",
  description: "",
  thumbnailUrl: "",
  officialSiteUrl: "",
  officialShopUrl: "",
  officialShopLabel: ""
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>("suggestions");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);
  const [thumbnailDrafts, setThumbnailDrafts] = useState<Record<string, string>>({});
  const [officialCandidates, setOfficialCandidates] = useState<OfficialProductCandidate[]>([]);
  const [collectMessage, setCollectMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: auth }) => {
      if (!auth.user?.email || !isAdminEmail(auth.user.email)) {
        router.replace("/");
        return;
      }
      setReady(true);
      void load().catch((error) => {
        setLoadError(error instanceof Error ? error.message : "관리자 데이터를 불러오지 못했습니다.");
      });
    });
  }, [router]);

  async function load() {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
    const text = await response.text();
    const payload = (text ? JSON.parse(text) : {}) as Dashboard | { error?: string };
    if (!response.ok) throw new Error("error" in payload && payload.error ? payload.error : "관리자 데이터를 불러오지 못했습니다.");
    setLoadError("");
    setData(payload as Dashboard);
  }

  async function uploadImage(bucket: string, file: File) {
    const supabase = createBrowserSupabaseClient();
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (upload.error) return { error: upload.error.message };
    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: publicUrl.publicUrl };
  }

  const reportGroups = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, Report[]>();
    for (const report of data.reports.filter((item) => item.status === "pending")) {
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

  async function resolveSuggestion(id: string, action: "resolve" | "reject", message: string) {
    setSavingId(id);
    const response = await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminMessage: message })
    });
    setSavingId(null);
    if (!response.ok) {
      alert("건의를 처리하지 못했습니다.");
      return;
    }
    await load();
  }

  async function createGallery(fromSuggestion?: Suggestion) {
    const form = fromSuggestion
      ? {
          ...galleryForm,
          name: fromSuggestion.requested_gallery_name || galleryForm.name,
          category: fromSuggestion.requested_gallery_category || galleryForm.category || "기타"
        }
      : galleryForm;
    if (!form.name.trim() || !form.slug.trim() || !form.category.trim()) {
      alert("갤러리명, 주소, 카테고리를 입력해주세요.");
      return;
    }
    setSavingId(fromSuggestion ? `gallery-${fromSuggestion.id}` : "gallery");
    const response = await fetch("/api/admin/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (response.ok && fromSuggestion) await resolveSuggestion(fromSuggestion.id, "resolve", "갤러리 추가 완료");
    setSavingId(null);
    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      alert(error.error ?? "갤러리를 추가하지 못했습니다.");
      return;
    }
    setGalleryForm(emptyGalleryForm);
    await load();
  }

  async function createProduct() {
    if (!productForm.title.trim() || !productForm.category.trim() || !productForm.mallName.trim() || !productForm.url.trim()) {
      alert("상품명, 카테고리, 판매처, URL을 입력해주세요.");
      return;
    }
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
        isOfficialProduct: productForm.source === "official_shop",
        offer: {
          source: productForm.source,
          mallName: productForm.mallName,
          price: Number(productForm.price) || 0,
          shippingFee: Number(productForm.shippingFee) || 0,
          url: productForm.url,
          isOfficial: productForm.source === "official_shop",
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

  async function collectOfficialProducts() {
    setSavingId("official-collect");
    setCollectMessage("");
    const response = await fetch("/api/admin/official-products/collect", { method: "POST" });
    const result = (await response.json()) as { items?: OfficialProductCandidate[]; skipped?: Array<unknown>; error?: string };
    setSavingId(null);
    if (!response.ok || !result.items) {
      alert(result.error ?? "공식몰 상품 후보를 수집하지 못했습니다.");
      return;
    }
    setOfficialCandidates(result.items);
    setCollectMessage(`수집 후보 ${result.items.length}개 · 제외 ${result.skipped?.length ?? 0}건`);
  }

  async function importOfficialProduct(candidate: OfficialProductCandidate) {
    setSavingId(`official-${candidate.key}`);
    const response = await fetch("/api/admin/official-products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(candidate)
    });
    setSavingId(null);
    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      alert(error.error ?? "공식 상품을 등록하지 못했습니다.");
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

  async function uploadProductImage(file: File) {
    setSavingId("product-image");
    const result = await uploadImage("product-images", file);
    setSavingId(null);
    if (!result.url) {
      alert(result.error ?? "상품 이미지를 업로드하지 못했습니다.");
      return;
    }
    setProductForm((current) => ({ ...current, imageUrl: result.url ?? "" }));
  }

  async function uploadGalleryImage(gallery: Gallery, file: File) {
    setSavingId(gallery.id);
    const result = await uploadImage("gallery-images", file);
    setSavingId(null);
    if (!result.url) {
      alert(result.error ?? "이미지를 업로드하지 못했습니다.");
      return;
    }
    setThumbnailDrafts((current) => ({ ...current, [gallery.id]: result.url ?? "" }));
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

  async function deleteGallery(gallery: Gallery) {
    if (!confirm(`"${gallery.name}" 갤러리를 DB에서 삭제할까요?`)) return;
    setSavingId(`delete-gallery-${gallery.id}`);
    const response = await fetch(`/api/admin/galleries/${gallery.id}`, { method: "DELETE" });
    setSavingId(null);
    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      alert(error.error ?? "갤러리를 삭제하지 못했습니다.");
      return;
    }
    await load();
  }

  if (loadError) {
    return <Card className="bg-pink-50 text-pink-700"><p className="font-black">{loadError}</p></Card>;
  }

  if (!ready || !data) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-berry" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#fff8fb] via-white to-[#f5edff] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#ff6f9b]">관리자</p>
            <h1 className="mt-1 text-2xl font-black text-[#3a285f]">세모덕 운영 관리</h1>
            <p className="mt-2 text-sm font-bold text-slate-500">건의, 신고, 공식 굿즈, 갤러리를 관리합니다.</p>
          </div>
          <Badge tone="mint"><ShieldCheck size={14} /> admin</Badge>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><Flag className="text-amber-500" /><p className="mt-2 text-sm font-bold text-slate-500">대기 신고</p><p className="mt-1 text-2xl font-black">{reportGroups.length}</p></Card>
        <Card className="p-4"><Link2 className="text-mint" /><p className="mt-2 text-sm font-bold text-slate-500">건의</p><p className="mt-1 text-2xl font-black">{data.suggestions.length}</p></Card>
        <Card className="p-4"><ImageIcon className="text-berry" /><p className="mt-2 text-sm font-bold text-slate-500">갤러리</p><p className="mt-1 text-2xl font-black">{data.galleries.length}</p></Card>
        <Card className="p-4"><Trash2 className="text-rose-500" /><p className="mt-2 text-sm font-bold text-slate-500">상품</p><p className="mt-1 text-2xl font-black">{data.products.length}</p></Card>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-[#efd7e7] bg-white/80 p-2 shadow-soft">
        {tabs.map(([key, label]) => <Button key={key} variant={activeTab === key ? "primary" : "ghost"} onClick={() => setActiveTab(key)}>{label}</Button>)}
      </div>

      {activeTab === "suggestions" ? (
        <div className="space-y-4">
          {data.suggestionSetupMissing ? <Card className="bg-amber-50 text-amber-800">건의함 테이블이 아직 없습니다. Supabase SQL Editor에서 supabase/admin-suggestions.sql을 실행해주세요.</Card> : null}
          <Card>
            <h2 className="text-xl font-black">유저 건의 처리</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {data.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap gap-2"><Badge tone={suggestion.status === "pending" ? "sun" : "gray"}>{suggestion.status}</Badge><Badge tone="mint">{suggestion.type === "gallery_request" ? "갤러리 추가" : suggestion.type}</Badge></div>
                    <p className="mt-2 font-black">{suggestion.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{suggestion.detail}</p>
                    {suggestion.requested_gallery_name ? <p className="mt-2 text-sm font-bold text-slate-500">요청 갤러리: {suggestion.requested_gallery_name} / {suggestion.requested_gallery_category || "카테고리 미입력"}</p> : null}
                    <p className="mt-2 text-xs font-bold text-slate-400">{suggestion.user?.email ?? "알 수 없음"} · {formatDateTime(suggestion.created_at)}</p>
                  </div>
                  {suggestion.status === "pending" ? <div className="flex flex-wrap gap-2">{suggestion.type === "gallery_request" ? <Button variant="secondary" onClick={() => createGallery(suggestion)} disabled={savingId === `gallery-${suggestion.id}`}>갤러리 추가</Button> : null}<Button variant="secondary" onClick={() => resolveSuggestion(suggestion.id, "resolve", "확인 완료")}>처리 완료</Button><Button variant="danger" onClick={() => resolveSuggestion(suggestion.id, "reject", "반려")}>반려</Button></div> : null}
                </div>
              ))}
              {!data.suggestions.length ? <p className="py-4 text-sm font-bold text-slate-500">대기 중인 건의가 없습니다.</p> : null}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <Card className="space-y-2">
            {reportGroups.map((group) => <button key={group.key} onClick={() => setSelectedKey(group.key)} className={`w-full rounded-xl p-3 text-left text-sm font-black ${selectedGroup?.key === group.key ? "bg-[#f4e8ff] text-[#6b3edb]" : "bg-cloud text-slate-600"}`}>{targetLabels[group.targetType]} · {group.reports.length}건</button>)}
            {!reportGroups.length ? <p className="text-sm font-bold text-slate-500">대기 신고가 없습니다.</p> : null}
          </Card>
          <Card>
            {selectedGroup ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="text-xl font-black">{selectedGroup.target?.title ?? selectedGroup.target?.content ?? "신고 대상"}</h2><p className="mt-1 text-sm font-bold text-slate-500">{targetLabels[selectedGroup.targetType]} · {selectedGroup.reports.length}건</p></div>
                  <div className="flex gap-2"><Button variant="secondary" onClick={() => resolveReport(selectedGroup.targetType, selectedGroup.targetId, "dismiss")}>기각</Button><Button variant="danger" onClick={() => resolveReport(selectedGroup.targetType, selectedGroup.targetId, "delete")}>삭제 처리</Button></div>
                </div>
                <div className="mt-4 divide-y divide-slate-100">{selectedGroup.reports.map((report) => <div key={report.id} className="py-3 text-sm"><p className="font-black">{report.category || report.reason || "신고"}</p><p className="mt-1 text-slate-600">{report.detail || report.reason || "상세 내용 없음"}</p><p className="mt-1 text-xs font-bold text-slate-400">{report.reporter?.email ?? "알 수 없음"} · {formatDateTime(report.created_at)}</p></div>)}</div>
              </div>
            ) : <p className="text-sm font-bold text-slate-500">선택된 신고가 없습니다.</p>}
          </Card>
        </div>
      ) : null}

      {activeTab === "products" ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-black">공식몰 상품 후보</h2><p className="mt-2 text-sm font-bold text-slate-500">공식몰 후보를 수집하고 필요한 항목만 등록합니다.</p>{collectMessage ? <p className="mt-2 text-sm font-black text-mint">{collectMessage}</p> : null}</div>
              <Button variant="secondary" onClick={collectOfficialProducts} disabled={savingId === "official-collect"}>{savingId === "official-collect" ? <Loader2 size={16} className="animate-spin" /> : null}공식몰 후보 수집</Button>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {officialCandidates.map((candidate) => <div key={candidate.key} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap gap-2"><Badge tone="mint">공식몰</Badge><Badge tone="gray">{candidate.gallerySlug}</Badge>{candidate.availabilityLabel ? <Badge tone="sun">{candidate.availabilityLabel}</Badge> : null}</div><p className="mt-2 font-black">{candidate.title}</p><a href={candidate.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-bold text-slate-500 hover:text-berry">{candidate.mallName}</a>{candidate.price ? <p className="mt-1 text-sm font-black text-ink">{candidate.price.toLocaleString("ko-KR")}원</p> : null}</div><Button variant="secondary" onClick={() => importOfficialProduct(candidate)} disabled={savingId === `official-${candidate.key}`}>공식 상품 등록</Button></div>)}
              {!officialCandidates.length ? <p className="py-4 text-sm font-bold text-slate-500">등록 가능한 공식몰 후보가 없습니다.</p> : null}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-black">상품/판매 링크 등록</h2>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-3"><input value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="상품명" /><input value={productForm.brand} onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="브랜드" /><input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="카테고리" /></div>
              <textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className="min-h-24 rounded-lg border p-3" placeholder="상품 설명" />
              <div className="grid gap-3 md:grid-cols-[1fr_auto]"><input value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="상품 이미지 URL" /><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold ring-1 ring-slate-200"><Upload size={16} /> 이미지 업로드<input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadProductImage(event.target.files[0])} /></label></div>
              <div className="grid gap-3 md:grid-cols-4"><select value={productForm.source} onChange={(event) => setProductForm({ ...productForm, source: event.target.value as ProductForm["source"] })} className="min-h-10 rounded-lg border px-3"><option value="official_shop">공식몰</option><option value="naver_shopping">네이버</option><option value="coupang">쿠팡</option><option value="user_submission">유저 제보</option><option value="external_search">외부 검색</option></select><input value={productForm.mallName} onChange={(event) => setProductForm({ ...productForm, mallName: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="판매처명" /><input value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="가격" /><input value={productForm.shippingFee} onChange={(event) => setProductForm({ ...productForm, shippingFee: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="배송비" /></div>
              <input value={productForm.url} onChange={(event) => setProductForm({ ...productForm, url: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="판매 링크 URL" />
              <div className="flex justify-end"><Button onClick={createProduct} disabled={savingId === "product"}>상품 등록</Button></div>
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-black">등록 상품</h2>
            <div className="mt-4 divide-y divide-slate-100">{data.products.map((product) => <div key={product.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-black">{product.title}</p><p className="mt-1 text-sm font-bold text-slate-500">{product.brand || "브랜드 없음"} · {product.category || "카테고리 없음"} · 신고 {product.report_count ?? 0}건</p></div><Button variant="danger" onClick={() => deleteProduct(product.id)}>삭제</Button></div>)}</div>
          </Card>
          <Card>
            <h2 className="text-xl font-black">등록된 판매 링크</h2>
            <div className="mt-4 divide-y divide-slate-100">{data.productOffers.map((offer) => <a key={offer.id} href={offer.url} target="_blank" className="grid gap-2 py-3 text-sm hover:text-berry"><p className="font-black">{offer.products?.title ?? offer.mall_name}</p><p className="font-bold text-slate-500">{sourceLabel(offer.source)} · {offer.mall_name} · {offer.price.toLocaleString("ko-KR")}원</p></a>)}</div>
          </Card>
        </div>
      ) : null}

      {activeTab === "galleries" ? (
        <Card>
          <h2 className="text-xl font-black">갤러리 관리</h2>
          <div className="mt-4 grid gap-3 rounded-xl bg-cloud p-3 md:grid-cols-4"><input value={galleryForm.name} onChange={(event) => setGalleryForm({ ...galleryForm, name: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="갤러리명" /><input value={galleryForm.slug} onChange={(event) => setGalleryForm({ ...galleryForm, slug: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="주소 slug" /><input value={galleryForm.category} onChange={(event) => setGalleryForm({ ...galleryForm, category: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="카테고리" /><Button onClick={() => createGallery()} disabled={savingId === "gallery"}>갤러리 추가</Button><input value={galleryForm.thumbnailUrl} onChange={(event) => setGalleryForm({ ...galleryForm, thumbnailUrl: event.target.value })} className="min-h-10 rounded-lg border px-3 md:col-span-2" placeholder="대표사진 URL" /><input value={galleryForm.officialSiteUrl} onChange={(event) => setGalleryForm({ ...galleryForm, officialSiteUrl: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="공식 SNS URL" /><input value={galleryForm.officialShopUrl} onChange={(event) => setGalleryForm({ ...galleryForm, officialShopUrl: event.target.value })} className="min-h-10 rounded-lg border px-3" placeholder="공식샵 URL" /></div>
          <div className="mt-4 grid gap-3">{data.galleries.map((gallery) => <div key={gallery.id} className="grid gap-2 rounded-lg bg-cloud p-3 md:grid-cols-[12rem_1fr_auto_auto_auto] md:items-center"><div><p className="font-black">{gallery.name}</p><p className="mt-1 text-xs font-bold text-slate-500">/{gallery.slug}</p></div><input value={thumbnailDrafts[gallery.id] ?? gallery.thumbnail_url ?? ""} onChange={(event) => setThumbnailDrafts((current) => ({ ...current, [gallery.id]: event.target.value }))} className="min-h-10 rounded-lg border border-slate-200 px-3" placeholder="대표사진 URL" /><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold ring-1 ring-slate-200"><Upload size={16} /> 업로드<input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadGalleryImage(gallery, event.target.files[0])} /></label><Button variant="secondary" onClick={() => saveThumbnail(gallery)} disabled={savingId === gallery.id}>저장</Button><Button variant="danger" onClick={() => deleteGallery(gallery)} disabled={savingId === `delete-gallery-${gallery.id}`}><Trash2 size={16} /> 삭제</Button></div>)}</div>
        </Card>
      ) : null}
    </div>
  );
}
