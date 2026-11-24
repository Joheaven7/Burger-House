"use client";

import { useState } from "react";
import clsx from "clsx";

interface ProductImageProps {
  src?: string; // image URL saved by admin (validated by backend against ALLOWED_IMAGE_HOSTS)
  alt?: string;
  className?: string;
  dimmed?: boolean;
}

/** Displays real food photography with smooth zoom on hover, with a fallback culinary graphic if image fails. */
export function ProductImage({ src, alt = "", className, dimmed = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <div className={clsx("overflow-hidden bg-charcoal/5 relative rounded-t-card", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- host is checked by backend allow-list */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
          className={clsx(
            "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105",
            dimmed && "opacity-40 grayscale",
          )}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={clsx(
        "flex flex-col items-center justify-center bg-gradient-to-br from-charcoal/5 to-charcoal/10 text-ink/40 relative overflow-hidden rounded-t-card",
        dimmed && "opacity-40 grayscale",
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-12 w-12 text-copper/60 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="32" cy="32" r="14" />
        <circle cx="32" cy="32" r="7" />
        <path d="M8 12v14M12 12v14M16 12v14M12 26v26" />
        <path d="M54 12c-5 4-5 14 0 18v22" />
      </svg>
      <span className="mt-1 text-[11px] font-semibold tracking-wider uppercase text-muted/60">
        Burger House Craft
      </span>
    </div>
  );
}
