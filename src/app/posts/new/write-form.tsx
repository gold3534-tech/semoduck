"use client";

import { useState } from "react";
import { Loader2, Sparkles, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { galleries, products } from "@/lib/mock-data";

type TagsResponse = { tags: string[]; category: string };
type KeywordResponse = { product_keywords: string[] };
type ExternalSearchResponse = {
  usedMock: boolean;
  items: Array<{
    id: string;
    title: string;
    mallName: string;
    price: number;
    url: string;
  }>;
};

export function WriteForm() {
  const [title, setTitle] = useState("요즘 쿠로미 키링 사고 싶은데 정품 어디서 사?");
  const [content, setContent] = useState("산리오 쿠로미 아크릴 키링 정품 판매처와 예약 특전 있는 곳이 궁금해요.");
  const [tags, setTags] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [externalGoods, setExternalGoods] = useState<ExternalSearchResponse["items"]>([]);
  const [usedMock, setUsedMock] = useState(false);
  const [loading, setLoading] = useState<"tags" | "keywords" | null>(null);

  async function recommendTags() {
    setLoading("tags");
    const response = await fetch("/api/ai/extract-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = (await response.json()) as TagsResponse;
    setTags(data.tags);
    setLoading(null);
  }

  async function previewProducts() {
    setLoading("keywords");
    const response = await fetch("/api/ai/extract-product-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = (await response.json()) as KeywordResponse;
    setKeywords(data.product_keywords);
    const firstKeyword = data.product_keywords[0] ?? title;
    const searchResponse = await fetch(`/api/products/external-search?q=${encodeURIComponent(firstKeyword)}&display=5`);
    const searchData = (await searchResponse.json()) as ExternalSearchResponse;
    setExternalGoods(searchData.items);
    setUsedMock(searchData.usedMock);
    setLoading(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            갤러리
            <select className="min-h-11 rounded-lg border border-slate-200 px-3">
              {galleries.map((gallery) => (
                <option key={gallery.id}>{gallery.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black">
            게시글 타입
            <select className="min-h-11 rounded-lg border border-slate-200 px-3">
              <option>구매고민글</option>
              <option>후기글</option>
              <option>정보글</option>
              <option>교환글</option>
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-black">
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-12 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" />
        </label>
        <label className="grid gap-2 text-sm font-black">
          본문
          <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-48 rounded-lg border border-slate-200 p-4 leading-7 outline-none focus:border-berry" />
        </label>
        <div className="rounded-lg border border-dashed border-slate-300 bg-cloud p-6 text-center text-sm font-bold text-slate-500">이미지 업로드 UI</div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={recommendTags} disabled={loading !== null}>
            {loading === "tags" ? <Loader2 size={16} className="animate-spin" /> : <Tags size={16} />}
            AI 태그 추천
          </Button>
          <Button type="button" variant="secondary" onClick={previewProducts} disabled={loading !== null}>
            {loading === "keywords" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            관련 굿즈 미리보기
          </Button>
          <Button type="button">등록</Button>
        </div>
      </Card>
      <aside className="space-y-4">
        <Card>
          <h2 className="font-black">추천 태그</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(tags.length ? tags : ["AI 버튼을 눌러보세요"]).map((tag) => (
              <Badge key={tag} tone={tags.length ? "pink" : "gray"}>
                #{tag}
              </Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">추출 키워드</h2>
          <div className="mt-3 space-y-2 text-sm font-bold text-slate-600">
            {(keywords.length ? keywords : ["굿즈 미리보기를 실행하면 키워드가 표시됩니다."]).map((keyword) => (
              <p key={keyword}>{keyword}</p>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">관련 굿즈 미리보기</h2>
          {usedMock && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-bold text-amber-700">API 키가 없거나 호출에 실패해 mock 데이터를 표시 중입니다.</p>}
          <div className="mt-3 space-y-2 text-sm font-bold text-slate-600">
            {(externalGoods.length ? externalGoods : products.slice(0, 3)).map((product) => (
              <a
                key={product.id}
                href={"url" in product ? product.url : "#"}
                target={"url" in product ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="block rounded-lg bg-cloud p-3 hover:text-berry"
              >
                {"mallName" in product ? `${product.title} · ${product.mallName} · ${product.price.toLocaleString("ko-KR")}원` : product.title}
              </a>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
