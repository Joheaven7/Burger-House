import { HeroBurger } from "@/components/3d/HeroBurger";
import { CraftSection } from "@/components/home/CraftSection";
import { WhyUsSection } from "@/components/home/WhyUsSection";
import { ProductGrid } from "@/components/menu/ProductGrid";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteConfig, siteUrl } from "@/lib/site";
import { messages } from "@/messages/en";
import { getMenuItems } from "@/services/menu";
import { getPublicSettings } from "@/services/settings";

export default async function HomePage() {
  const [featured, settings] = await Promise.all([getMenuItems({ featured: true }), getPublicSettings()]);
  const featuredItems = featured.slice(0, 4);

  const { phone, address, hours } = settings.contact;
  const hasContact = Boolean(phone || address || hours);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.restaurantName,
    url: siteUrl,
    hasMenu: `${siteUrl}/menu`,
    ...(phone ? { telephone: phone } : {}),
    ...(address ? { address: { "@type": "PostalAddress", streetAddress: address } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      {/* Cinematic Hero Section */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <Badge variant="gold" size="sm" dot>
              {messages.hero.eyebrow}
            </Badge>

            <h1
              id="hero-title"
              className="font-editorial text-5xl font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl leading-[1.05]"
            >
              {messages.hero.headline}
            </h1>

            <p className="max-w-prose text-lg sm:text-xl text-muted leading-relaxed">
              {messages.hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <ButtonLink href={siteConfig.orderHref} size="lg">
                {messages.hero.primaryCta}
              </ButtonLink>
              <ButtonLink href="/menu" variant="secondary" size="lg">
                {messages.hero.secondaryCta}
              </ButtonLink>
            </div>

            <p className="text-xs text-muted flex items-center gap-2 pt-2">
              <span className="inline-block h-2 w-2 rounded-full bg-copper/80 animate-ping" aria-hidden="true" />
              <span>{messages.hero.interactiveTip}</span>
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <HeroBurger />
          </div>
        </Container>
      </section>

      {/* Signature Burgers Section */}
      <section aria-labelledby="featured-title" className="py-16 sm:py-24 bg-cream">
        <Container className="space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-ink/10 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-dark">
                {messages.home.featuredEyebrow}
              </span>
              <h2 id="featured-title" className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-ink mt-1">
                {messages.home.featuredTitle}
              </h2>
              <p className="text-muted text-base sm:text-lg mt-2">
                {messages.home.featuredSubtitle}
              </p>
            </div>
            <ButtonLink href="/menu" variant="ghost" className="self-start sm:self-auto">
              {messages.menu.viewFullMenu} →
            </ButtonLink>
          </div>

          {featuredItems.length > 0 ? (
            <ProductGrid items={featuredItems} currency={settings.currency} locale={settings.locale} columns={4} />
          ) : (
            <EmptyState
              title={messages.home.featuredEmptyTitle}
              description={messages.home.featuredEmptyText}
            />
          )}
        </Container>
      </section>

      {/* The Art of the Burger (Craft & Quality) */}
      <CraftSection />

      {/* Why Connoisseurs Choose Us (Dark Contrast Section) */}
      <WhyUsSection />

      {/* Location & Hours Section */}
      {hasContact && (
        <section id="location" aria-labelledby="location-title" className="py-16 sm:py-24 bg-cream">
          <Container width="narrow">
            <SectionHeader
              eyebrow={messages.home.locationEyebrow}
              title={messages.home.locationTitle}
              subtitle={messages.home.locationSubtitle}
              align="center"
              className="mb-10"
            />
            <Card surface="light" padding="lg" className="border-ink/10 shadow-luxury space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {address && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Kitchen Location</h3>
                    <p className="font-semibold text-ink text-base">{address}</p>
                  </div>
                )}
                {phone && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Direct Line</h3>
                    <p>
                      <a href={`tel:${phone.replace(/\s+/g, "")}`} className="font-semibold text-orange-dark hover:underline text-base">
                        {phone}
                      </a>
                    </p>
                  </div>
                )}
              </div>
              {hours && (
                <div className="pt-4 border-t border-ink/10 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Service Hours</h3>
                  <p className="font-semibold text-ink text-base">{hours}</p>
                </div>
              )}
            </Card>
          </Container>
        </section>
      )}

      {/* Order Call to Action Banner */}
      <section aria-labelledby="cta-title" className="py-16 sm:py-24 bg-charcoal text-cream relative overflow-hidden">
        <Container width="standard">
          <div className="relative rounded-card border border-cream/15 bg-surface-dark/80 p-8 sm:p-14 text-center space-y-6 shadow-glow">
            <Badge variant="gold" size="sm">
              Freshly Prepared
            </Badge>
            <h2 id="cta-title" className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-cream max-w-xl mx-auto">
              {messages.home.ctaTitle}
            </h2>
            <p className="max-w-md mx-auto text-muted-dark text-base sm:text-lg">
              {messages.home.ctaText}
            </p>
            <div className="pt-2">
              <ButtonLink href={siteConfig.orderHref} size="lg">
                {messages.home.ctaButton}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
