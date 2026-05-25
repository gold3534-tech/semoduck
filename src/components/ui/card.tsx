import { clsx } from "clsx";
import { PropsWithChildren } from "react";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={clsx("rounded-2xl border border-[#efd7e7] bg-white/82 p-4 shadow-soft backdrop-blur", className)}>{children}</section>;
}
