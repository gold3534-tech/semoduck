import { notFound, redirect } from "next/navigation";
import { EditPostForm } from "@/app/posts/[id]/edit/edit-form";
import { Card } from "@/components/ui/card";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) redirect(`/login?next=/posts/${id}/edit`);

  const supabase = createDataSupabaseClient();
  const { data: post } = await supabase.from("posts").select("id,title,content,user_id").eq("id", id).eq("is_deleted", false).single();
  if (!post) notFound();
  if (post.user_id !== data.user.id) redirect(`/posts/${id}`);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="bg-gradient-to-br from-[#fff8fb] via-white to-[#f5edff] p-7">
        <p className="text-sm font-black text-[#ff6f9b]">게시글 수정</p>
        <h1 className="mt-2 text-3xl font-black text-[#3a285f]">작성한 글을 다듬어요</h1>
      </Card>
      <EditPostForm postId={post.id} initialTitle={post.title} initialContent={post.content} />
    </div>
  );
}
