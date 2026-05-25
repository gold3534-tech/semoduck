import { SuggestionForm } from "@/app/suggestions/suggestion-form";

export default function SuggestionsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#dfc5ee] bg-gradient-to-br from-[#fff8fb] via-[#fbf0ff] to-[#fff7ee] p-8 shadow-soft md:p-12">
        <div className="pointer-events-none absolute right-8 top-8 hidden text-7xl md:block">💌</div>
        <p className="text-sm font-black text-[#ff6f9b]">건의함</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-[#6f4ab4]">세모덕에 필요한 갤러리나 기능을 알려주세요</h1>
        <p className="mt-4 max-w-xl text-sm font-bold leading-6 text-slate-500">갤러리 추가 요청, 기능 제안, 오류 제보를 관리자에게 보낼 수 있습니다.</p>
      </section>
      <SuggestionForm />
    </div>
  );
}
