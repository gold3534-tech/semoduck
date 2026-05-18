import { clsx } from "clsx";
import { PropsWithChildren } from "react";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-soft", className)}>{children}</section>;
}
