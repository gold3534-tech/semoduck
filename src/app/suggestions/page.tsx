import { SuggestionForm } from "@/app/suggestions/suggestion-form";

export default function SuggestionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-black text-berry">건의함</p>
        <h1 className="mt-2 text-3xl font-black">세모덕에 필요한 갤러리나 기능을 알려주세요</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">갤러리 추가 요청, 기능 제안, 오류 제보를 관리자에게 보낼 수 있습니다.</p>
      </div>
      <SuggestionForm />
    </div>
  );
}
