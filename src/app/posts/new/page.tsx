import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WriteForm } from "@/app/posts/new/write-form";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getGalleries() {
  const supabase = createDataSupabaseClient();
  const { data } = await supabase.from("galleries").select("id,name,slug").order("name");
  return data ?? [];
}

export default async function NewPostPage() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) {
    redirect("/login?next=/posts/new");
  }

  const galleries = await getGalleries();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">글쓰기</p>
        <h1 className="mt-2 text-3xl font-black">AI 도움을 받아 게시글을 작성해요</h1>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white" />}>
        <WriteForm galleries={galleries} />
      </Suspense>
    </div>
  );
}
