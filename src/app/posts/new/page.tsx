import { WriteForm } from "@/app/posts/new/write-form";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">글쓰기</p>
        <h1 className="mt-2 text-3xl font-black">AI 도움을 받아 게시글을 작성해요</h1>
      </div>
      <WriteForm />
    </div>
  );
}
