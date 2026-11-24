import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type CardSurface = "light" | "dark" | "charcoal" | "cream";
export type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  padding?: CardPadding;
  hover?: boolean;
  children: ReactNode;
}

const surfaceStyles: Record<CardSurface, string> = {
  light: "bg-surface text-ink border border-ink/10 shadow-sm",
  cream: "bg-cream text-ink border border-ink/10",
  dark: "bg-surface-dark text-cream border border-cream/10",
  charcoal: "bg-charcoal text-cream border border-cream/10",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  surface = "light",
  padding = "md",
  hover = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-card transition-all duration-200",
        surfaceStyles[surface],
        paddingStyles[padding],
        hover && "hover:-translate-y-0.5 hover:shadow-luxury hover:border-copper/40",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
