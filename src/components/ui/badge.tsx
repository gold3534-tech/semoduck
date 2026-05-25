import { clsx } from "clsx";
import { PropsWithChildren } from "react";

type BadgeTone = "pink" | "mint" | "violet" | "sun" | "gray";

const tones: Record<BadgeTone, string> = {
  pink: "bg-[#ffe1ec] text-[#f05f8e]",
  mint: "bg-[#d8fbf4] text-[#188a7e]",
  violet: "bg-[#efe2ff] text-[#7a50bd]",
  sun: "bg-[#fff2bd] text-[#c47b00]",
  gray: "bg-[#f4edf8] text-[#4b3a6d]"
};

export function Badge({ children, tone = "gray" }: PropsWithChildren<{ tone?: BadgeTone }>) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black", tones[tone])}>{children}</span>;
}
