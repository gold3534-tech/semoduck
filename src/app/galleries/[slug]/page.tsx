import { notFound } from "next/navigation";
import Link from "next/link";
import { PenLine, Users } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { galleries, posts, products } from "@/lib/mock-data";

export default async function GalleryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = galleries.find((item) => item.slug === slug);
  if (!gallery) notFound();

  const galleryPosts = posts.filter((post) => post.gallerySlug === gallery.slug);
  const galleryProducts = products.filter((product) => product.gallerySlugs.includes(gallery.slug));

  return (
    <div className="space-y-6">
      <Card className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <Badge tone="mint">{gallery.category}</Badge>
          <h1 className="mt-3 text-3xl font-black">{gallery.name}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">{gallery.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {gallery.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-4 md:items-end">
          <div className="flex gap-4 text-sm font-bold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users size={16} /> {gallery.followerCount.toLocaleString("ko-KR")} 팔로워
            </span>
            <span>{gallery.postCount.toLocaleString("ko-KR")} 게시글</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">팔로우</Button>
            <Link href="/posts/new">
              <Button>
                <PenLine size={16} />
                글쓰기
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["인기글", "최신글", "굿즈", "교환/양도", "AI 요약"].map((tab, index) => (
          <button key={tab} className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-black ${index === 0 ? "bg-ink text-white" : "bg-white text-slate-600"}`}>
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-black">갤러리 인기글</h2>
          {(galleryPosts.length ? galleryPosts : posts.slice(0, 2)).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-black">관련 굿즈</h2>
          {galleryProducts.length ? (
            galleryProducts.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <Card>
              <p className="font-bold text-slate-500">아직 연결된 굿즈가 없습니다.</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
