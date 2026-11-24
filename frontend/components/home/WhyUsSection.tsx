import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { messages } from "@/messages/en";

export function WhyUsSection() {
  return (
    <section aria-labelledby="why-title" className="py-16 sm:py-24 bg-charcoal text-cream">
      <Container>
        <SectionHeader
          eyebrow={messages.home.whyEyebrow}
          title={messages.home.whyTitle}
          subtitle={messages.home.whySubtitle}
          tone="dark"
          align="center"
          className="mb-12 sm:mb-16"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {messages.home.whyFeatures.map((feature) => (
            <Card
              key={feature.title}
              surface="dark"
              hover
              padding="lg"
              className="border-cream/10 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <Badge variant="gold" size="sm">
                  {feature.badge}
                </Badge>
                <h3 className="font-editorial text-2xl font-bold text-cream">
                  {feature.title}
                </h3>
                <p className="text-muted-dark text-sm sm:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
