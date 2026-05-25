"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export function ProductImageGallery({ images, title }: { images: string[]; title: string }) {
  const cleanImages = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);
  const current = cleanImages[index] ?? "";
  const hasMany = cleanImages.length > 1;

  function move(delta: number) {
    if (!hasMany) return;
    setIndex((currentIndex) => (currentIndex + delta + cleanImages.length) % cleanImages.length);
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f7f2fb]">
        {current ? <Image src={current} alt={title} fill priority className="object-cover" sizes="520px" /> : null}
        {hasMany ? (
          <>
            <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#6f4ab4] ring-1 ring-[#ead8f4]">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#6f4ab4] ring-1 ring-[#ead8f4]">
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>

      {hasMany ? (
        <>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {cleanImages.map((image, imageIndex) => (
              <button
                key={`${image}-${imageIndex}`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f7f2fb] ring-2 ${index === imageIndex ? "ring-[#9b63d6]" : "ring-[#ead8f4]"}`}
              >
                <Image src={image} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
          <div className="mt-1 flex justify-center gap-1.5">
            {cleanImages.map((image, imageIndex) => (
              <button key={`dot-${image}-${imageIndex}`} type="button" onClick={() => setIndex(imageIndex)} className={`h-2 rounded-full transition ${index === imageIndex ? "w-5 bg-[#9b63d6]" : "w-2 bg-[#dcc8ec]"}`} aria-label={`${imageIndex + 1}번째 이미지`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
