"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { useAdminLive } from "@/features/admin/LiveContext";
import { adminText } from "@/messages/admin";
import { messages } from "@/messages/en";

export function AdminSidebar() {
  const pathname = usePathname();
  const { stats } = useAdminLive();
  const pending = stats?.pendingNow ?? 0;

  const items = [
    { label: messages.admin.nav.overview, href: "/admin", badge: 0 },
    { label: messages.admin.nav.orders, href: "/admin/orders", badge: pending },
    { label: messages.admin.nav.menu, href: "/admin/menu", badge: 0 },
    { label: messages.admin.nav.settings, href: "/admin/settings", badge: 0 },
  ];

  return (
    <aside className="border-b lg:border-b-0 lg:border-r border-cream/10 bg-charcoal text-cream lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 flex flex-col justify-between">
      <div>
        {/* Brand & Console Header */}
        <div className="hidden px-6 pt-6 pb-4 lg:block space-y-2 border-b border-cream/10">
          <Link href="/admin" className="block focus-visible:outline-none">
            <span className="font-editorial text-2xl font-bold tracking-tight text-cream">
              {messages.siteName}
              <span className="text-copper ml-0.5" aria-hidden="true">.</span>
            </span>
          </Link>
          <div>
            <Badge variant="gold" size="sm">
              Admin Console
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          aria-label={messages.admin.mainNav}
          className="flex gap-1.5 overflow-x-auto p-3 lg:flex-col lg:px-4 lg:py-4"
        >
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center justify-between gap-3 whitespace-nowrap rounded-control px-4 py-3 text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange/40",
                  active
                    ? "bg-orange text-white shadow-sm"
                    : "text-cream/80 hover:bg-cream/10 hover:text-cream",
                )}
              >
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-copper px-2 py-0.5 text-xs font-bold text-charcoal shadow-sm">
                    <span aria-hidden="true">{item.badge}</span>
                    <span className="sr-only">{adminText.shell.pendingBadge(item.badge)}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Storefront Quick Link */}
      <div className="hidden lg:block p-4 border-t border-cream/10">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-control border border-cream/10 p-3 text-xs font-semibold text-muted-dark hover:text-cream hover:bg-cream/5 transition-colors"
        >
          <span>{messages.admin.viewSite}</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </aside>
  );
}
