import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";
import { messages } from "@/messages/en";

interface FooterProps {
  contact: { phone: string; address: string; hours: string };
}

export function Footer({ contact }: FooterProps) {
  const { phone, address, hours } = contact;
  const hasContact = Boolean(phone || address || hours);

  return (
    <footer id="contact" className="scroll-mt-20 border-t border-cream/10 bg-charcoal text-cream">
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand Column */}
        <div className="space-y-4 lg:col-span-2">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-3xl font-bold tracking-tight text-cream">
              {siteConfig.name}
              <span className="text-copper ml-1" aria-hidden="true">.</span>
            </span>
          </Link>
          <p className="max-w-md text-sm leading-relaxed text-muted-dark">
            {messages.tagline} Handcrafted gourmet burgers prepared with custom dry-aged beef,
            artisanal brioche, and signature house sauces. Delivered fresh to your door.
          </p>
        </div>

        {/* Explore Links */}
        <nav aria-label={messages.footer.navTitle} className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-copper">
            {messages.footer.navTitle}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-dark hover:text-cream transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={siteConfig.orderHref} className="text-copper hover:underline font-semibold">
                {messages.nav.order}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contact & Hours Column */}
        {hasContact && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-copper">
              {messages.footer.contactTitle}
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-dark">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="hover:text-cream transition-colors"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {address && <li>{address}</li>}
              {hours && (
                <li>
                  <span className="text-cream/90 font-medium">{messages.footer.hoursLabel}:</span>{" "}
                  {hours}
                </li>
              )}
            </ul>
          </div>
        )}
      </Container>

      {/* Bottom Bar */}
      <div className="border-t border-cream/10">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 text-xs text-muted-dark">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {messages.footer.rights}
          </p>
          <p className="text-[11px] text-muted-dark/70">
            A real kitchen, one location. Pure craft.
          </p>
        </Container>
      </div>
    </footer>
  );
}
