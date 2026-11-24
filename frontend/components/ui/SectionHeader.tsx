import clsx from "clsx";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "light",
  action,
  className,
}: SectionHeaderProps) {
  const isDark = tone === "dark";
  const isCenter = align === "center";

  return (
    <div
      className={clsx(
        "space-y-3",
        isCenter ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left",
        className,
      )}
    >
      {eyebrow && (
        <span
          className={clsx(
            "inline-block text-xs font-bold uppercase tracking-widest",
            isDark ? "text-copper" : "text-orange-dark",
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={clsx(
          "font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight",
          isDark ? "text-cream" : "text-ink",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={clsx(
            "text-base sm:text-lg leading-relaxed",
            isDark ? "text-muted-dark" : "text-muted",
          )}
        >
          {subtitle}
        </p>
      )}
      {action && <div className={clsx("pt-2 flex", isCenter && "justify-center")}>{action}</div>}
    </div>
  );
}
