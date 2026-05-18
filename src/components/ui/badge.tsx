import { clsx } from "clsx";
import { PropsWithChildren } from "react";

type BadgeTone = "pink" | "mint" | "violet" | "sun" | "gray";

const tones: Record<BadgeTone, string> = {
  pink: "bg-pink-100 text-pink-700",
  mint: "bg-teal-100 text-teal-700",
  violet: "bg-violet-100 text-violet-700",
  sun: "bg-amber-100 text-amber-700",
  gray: "bg-slate-100 text-slate-600"
};

export function Badge({ children, tone = "gray" }: PropsWithChildren<{ tone?: BadgeTone }>) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}
