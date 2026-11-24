import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "brand" | "gold" | "neutral" | "outline" | "success" | "danger";
export type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  brand: "bg-orange/15 text-orange-dark border border-orange/30",
  gold: "bg-copper/15 text-copper-dark border border-copper/30",
  neutral: "bg-ink/10 text-ink border border-ink/10",
  outline: "bg-transparent text-ink border border-ink/20",
  success: "bg-emerald-500/15 text-emerald-800 border border-emerald-500/25",
  danger: "bg-orange-dark/15 text-orange-dark border border-orange-dark/30",
};

const dotStyles: Record<BadgeVariant, string> = {
  brand: "bg-orange",
  gold: "bg-copper",
  neutral: "bg-ink/60",
  outline: "bg-ink/60",
  success: "bg-emerald-600",
  danger: "bg-orange-dark",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5 text-xs font-semibold",
  md: "px-3 py-1 text-sm font-semibold",
};

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...rest}
    >
      {dot && <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", dotStyles[variant])} aria-hidden="true" />}
      {children}
    </span>
  );
}
