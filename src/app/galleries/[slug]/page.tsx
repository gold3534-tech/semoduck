import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, PenLine, Users } from "lucide-react";
import { FollowGalleryButton } from "@/app/galleries/[slug]/follow-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel } from "@/lib/format";
import { officialSourceForGallery } from "@/lib/official-sources";
import { createDataSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

export default async function GalleryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "이터널리턴") {
    redirect("/galleries/eternal-return");
  }

  const supabase = createDataSupabaseClient();
  const { data: gallery } = await supabase.from("galleries").select("id,name,slug,description,category,follower_count,post_count").eq("slug", slug).single();
  if (!gallery) notFound();
  const { data: dbOfficialSource } = await supabase.from("gallery_official_sources").select("official_site_url,official_shop_url,shop_label,notes").eq("gallery_id", gallery.id).maybeSingle();
  const fallbackOfficialSource = officialSourceForGallery(gallery.slug);
  const officialSource = dbOfficialSource
    ? {
        officialSiteUrl: dbOfficialSource.official_site_url,
        officialShopUrl: dbOfficialSource.official_shop_url ?? undefined,
        shopLabel: dbOfficialSource.shop_label ?? undefined,
        notes: dbOfficialSource.notes ?? undefined
      }
    : fallbackOfficialSource;
  const { data: posts } = await supabase.from("posts").select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,profiles(nickname,email)").eq("gallery_id", gallery.id).eq("is_deleted", false).order("created_at", { ascending: false }).limit(20);

  return (
    <div className="space-y-6">
      <Card className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div><Badge tone="mint">{gallery.category}</Badge><h1 className="mt-3 text-3xl font-black">{gallery.name}</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">{gallery.description}</p></div>
        <div className="flex flex-col items-start justify-between gap-4 md:items-end"><div className="flex gap-4 text-sm font-bold text-slate-500"><span className="inline-flex items-center gap-1"><Users size={16} /> {Number(gallery.follower_count ?? 0).toLocaleString("ko-KR")} 팔로워</span><span>{Number(gallery.post_count ?? 0).toLocaleString("ko-KR")} 게시글</span></div><div className="flex flex-wrap gap-2">{officialSource ? <a href={officialSource.officialSiteUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary"><ExternalLink size={16} /> 공식 SNS</Button></a> : null}{officialSource?.officialShopUrl ? <a href={officialSource.officialShopUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary"><ExternalLink size={16} /> 공식몰</Button></a> : null}<FollowGalleryButton slug={slug} initialFollowed={false} /><Link href={`/posts/new?gallery=${slug}`}><Button><PenLine size={16} /> 글쓰기</Button></Link></div></div>
      </Card>
      <section className="space-y-4"><h2 className="text-2xl font-black">갤러리 최신글</h2>{(posts ?? []).map((post) => { const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles; return <Link key={post.id} href={`/posts/${post.id}`} className="block"><Card className="transition hover:bg-pink-50"><div className="flex flex-wrap items-center gap-2"><Badge tone="pink">{postTypeLabel(post.post_type)}</Badge><span className="text-xs font-bold text-slate-500">{profile?.nickname ?? profile?.email ?? "회원"}</span><span className="text-xs font-bold text-slate-400">{formatDateTime(post.created_at)}</span></div><p className="mt-2 text-lg font-black text-ink">{post.title}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p><p className="mt-3 text-sm font-bold text-slate-500">좋아요 {post.like_count} · 댓글 {post.comment_count} · 스크랩 {post.bookmark_count}</p></Card></Link>; })}{!(posts ?? []).length && <Card>아직 작성된 글이 없습니다.</Card>}</section>
    </div>
  );
}
