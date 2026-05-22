import { clsx } from "clsx";
import { PropsWithChildren } from "react";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={clsx("rounded-lg border border-violet/15 bg-white/92 p-5 shadow-soft", className)}>{children}</section>;
}
