import { X } from "lucide-react";

export function UploadedImagePreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[9rem_1fr_auto] md:items-center">
      <div className="overflow-hidden rounded-lg bg-slate-100">
        <img src={url} alt="업로드한 이미지 미리보기" className="aspect-[4/3] w-full object-cover" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-slate-700">업로드한 이미지</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs font-bold text-slate-500 hover:text-berry">
          {url}
        </a>
      </div>
      <button type="button" onClick={onRemove} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-rose-50 px-3 text-sm font-black text-rose-600 hover:bg-rose-100">
        <X size={15} />
        삭제
      </button>
    </div>
  );
}
