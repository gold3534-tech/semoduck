import Link from "next/link";
import { ArrowRight, CalendarClock, Flame, Sparkles } from "lucide-react";
import { GalleryCard } from "@/components/gallery-card";
import { PostCard } from "@/components/post-card";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { events, galleries, posts, products } from "@/lib/mock-data";

export default function HomePage() {
  const keywords = ["쿠로미", "포켓몬", "BTS", "스텔라이브", "롤", "예약판매"];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-2xl bg-ink p-6 text-white shadow-soft md:grid-cols-[1.25fr_0.75fr] md:p-10">
        <div className="flex min-h-[21rem] flex-col justify-between">
          <div>
            <Badge tone="sun">세상의 모든 덕질</Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">팬덤 이야기에서 굿즈 링크까지 한 번에 모으는 세모덕</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              갤러리에서 후기를 나누고, AI가 태그와 굿즈 키워드를 뽑고, 공식샵·네이버·쿠팡·자체 마켓 링크를 한 화면에서 비교합니다.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-ink">
              관심사 시작하기 <ArrowRight size={17} />
            </Link>
            <Link href="/posts/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">
              글쓰기
            </Link>
          </div>
        </div>
        <div className="grid content-end gap-3">
          <Card className="bg-white/10 text-white ring-1 ring-white/15">
            <div className="flex items-center gap-2 text-sm font-black text-sun">
              <Sparkles size={17} />
              오늘의 AI 요약
            </div>
            <p className="mt-3 leading-7 text-white/80">산리오 갤러리에서는 쿠로미 키링 재입고, 공식몰 예약 특전, 양도글 시세 이야기가 빠르게 올라오고 있어요.</p>
          </Card>
          <Card className="bg-white/10 text-white ring-1 ring-white/15">
            <div className="flex items-center gap-2 text-sm font-black text-mint">
              <Flame size={17} />
              급상승 키워드
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-white/12 px-3 py-1 text-sm font-bold">
                  #{keyword}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-black text-berry">내 관심 갤러리</p>
            <h2 className="text-2xl font-black">지금 활발한 덕질 방</h2>
          </div>
          <Link href="/galleries" className="text-sm font-black text-slate-500 hover:text-ink">
            전체보기
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {galleries.slice(0, 3).map((gallery) => (
            <GalleryCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-black">오늘의 인기글</h2>
            <Link href="/galleries" className="text-sm font-black text-slate-500 hover:text-ink">
              갤러리로 이동
            </Link>
          </div>
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock size={20} className="text-berry" />
            <h2 className="text-2xl font-black">마감 임박 일정</h2>
          </div>
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black">{event.title}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{event.endDate} 마감</p>
                </div>
                <Badge tone="sun">{event.eventType}</Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-black">추천 굿즈</h2>
          <Link href="/goods" className="text-sm font-black text-slate-500 hover:text-ink">
            더 보기
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
