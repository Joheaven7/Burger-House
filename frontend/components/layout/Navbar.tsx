"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { CartLink } from "@/components/cart/CartLink";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";
import { messages } from "@/messages/en";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu with Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur-md">
        <Container className="flex h-20 items-center justify-between">
          {/* Brand Logo & Tagline */}
          <Link href="/" className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/30 rounded-control">
            <span className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-ink group-hover:text-orange-dark transition-colors">
              {siteConfig.name}
              <span className="text-copper ml-1" aria-hidden="true">.</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted font-semibold -mt-1">
              {messages.tagline}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label={messages.nav.mainNav} className="hidden items-center gap-8 md:flex">
            {siteConfig.nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-semibold tracking-wide transition-colors ${
                    active ? "text-orange-dark font-bold" : "text-ink/80 hover:text-orange-dark"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <CartLink />
            <ButtonLink href={siteConfig.orderHref} size="md">
              {messages.nav.order}
            </ButtonLink>
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <CartLink showLabel={false} />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-ink/10 text-ink hover:bg-ink/5"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? messages.nav.closeMenu : messages.nav.openMenu}
              onClick={() => setOpen((value) => !value)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </Container>

        {/* Mobile Navigation Drawer */}
        {open && (
          <div id="mobile-menu" className="border-t border-ink/10 bg-cream/98 px-4 py-6 shadow-luxury md:hidden">
            <Container className="flex flex-col gap-3">
              <nav aria-label={messages.nav.mainNav} className="flex flex-col gap-2">
                {siteConfig.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-control px-4 py-3 text-base font-semibold text-ink hover:bg-ink/5 active:bg-ink/10"
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="pt-4 border-t border-ink/10 flex flex-col gap-3">
                <ButtonLink href={siteConfig.orderHref} size="lg" className="w-full" onClick={() => setOpen(false)}>
                  {messages.nav.order}
                </ButtonLink>
              </div>
            </Container>
          </div>
        )}
      </header>
    </>
  );
}
