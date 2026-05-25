import { clsx } from "clsx";
import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-r from-[#ff6f9b] to-[#a56be8] text-white shadow-sm hover:brightness-105",
  secondary: "bg-white text-[#3a285f] ring-1 ring-[#e6c9ef] hover:bg-[#fff1f7]",
  ghost: "bg-transparent text-slate-600 hover:bg-white/80",
  danger: "bg-rose-500 text-white hover:bg-rose-600"
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>) {
  return (
    <button
      className={clsx("inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
