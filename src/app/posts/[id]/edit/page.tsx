import { notFound, redirect } from "next/navigation";
import { EditPostForm } from "@/app/posts/[id]/edit/edit-form";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) redirect(`/login?next=/posts/${id}/edit`);

  const admin = createAdminSupabaseClient();
  const { data: post } = await admin.from("posts").select("id,title,content,user_id").eq("id", id).eq("is_deleted", false).single();
  if (!post) notFound();
  if (post.user_id !== data.user.id) redirect(`/posts/${id}`);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-black text-berry">게시글 수정</p>
        <h1 className="mt-2 text-3xl font-black">작성한 글을 다듬어요</h1>
      </div>
      <EditPostForm postId={post.id} initialTitle={post.title} initialContent={post.content} />
    </div>
  );
}
