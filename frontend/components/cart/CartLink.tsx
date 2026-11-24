"use client";

import Link from "next/link";
import clsx from "clsx";
import { useCart } from "@/features/cart/CartContext";
import { siteConfig } from "@/lib/site";
import { messages } from "@/messages/en";

interface CartLinkProps {
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export function CartLink({ showLabel = true, className, onClick }: CartLinkProps) {
  const { count, hydrated } = useCart();
  const shown = hydrated ? count : 0;

  return (
    <Link
      href={siteConfig.cartHref}
      onClick={onClick}
      aria-label={messages.cart.navLabel(shown)}
      className={clsx(
        "relative inline-flex min-h-11 items-center gap-2 rounded-control px-3 font-semibold text-ink hover:bg-ink/5",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2" />
        <circle cx="9.5" cy="20" r="1.2" />
        <circle cx="17" cy="20" r="1.2" />
      </svg>
      {showLabel && <span aria-hidden="true">{messages.cart.navText}</span>}
      {shown > 0 && (
        <span
          aria-hidden="true"
          className="inline-flex min-w-6 items-center justify-center rounded-full bg-tomato px-1.5 text-sm font-bold text-white"
        >
          {shown}
        </span>
      )}
    </Link>
  );
}