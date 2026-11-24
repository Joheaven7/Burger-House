import Link from "next/link";
import clsx from "clsx";
import { messages } from "@/messages/en";
import type { MenuCategory } from "@/types/menu";

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange/30",
        active
          ? "border-orange bg-orange text-white shadow-sm"
          : "border-ink/15 bg-surface/80 text-ink/80 hover:border-orange/50 hover:text-orange-dark",
      )}
    >
      {children}
    </Link>
  );
}

export function CategoryTabs({ categories, activeSlug }: { categories: MenuCategory[]; activeSlug?: string }) {
  return (
    <nav aria-label={messages.menu.categoriesLabel} className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <ul className="flex gap-2.5 whitespace-nowrap">
        <li>
          <TabLink href="/menu" active={!activeSlug}>
            {messages.menu.all}
          </TabLink>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <TabLink href={`/menu?category=${category.slug}`} active={activeSlug === category.slug}>
              {category.name}
            </TabLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
