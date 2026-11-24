import { messages } from "@/messages/en";

export interface NavItem {
  label: string;
  href: string;
}

export const siteConfig = {
  name: messages.siteName,
  nav: [
    { label: messages.nav.menu, href: "/menu" },
    { label: messages.nav.story, href: "/#story" },
    { label: messages.nav.contact, href: "/#contact" },
  ] satisfies NavItem[],
  orderHref: "/order",
    cartHref: "/cart",

 
  social: [] as NavItem[],
};


// The public address of the website, used for search results and link previews.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";