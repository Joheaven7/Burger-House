import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { messages } from "@/messages/en";

export function CraftSection() {
  return (
    <section id="story" aria-labelledby="craft-title" className="scroll-mt-20 py-16 sm:py-24 bg-surface/50 border-y border-ink/5">
      <Container>
        <SectionHeader
          eyebrow={messages.home.craftEyebrow}
          title={messages.home.craftTitle}
          subtitle={messages.home.craftSubtitle}
          align="center"
          className="mb-12 sm:mb-16"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {messages.home.craftPillars.map((pillar, idx) => (
            <Card
              key={pillar.title}
              surface="light"
              hover
              padding="lg"
              className="flex flex-col justify-between border-ink/10 relative overflow-hidden group"
            >
              <div className="space-y-4">
                <span className="font-editorial text-4xl font-bold text-copper/40 group-hover:text-copper transition-colors">
                  0{idx + 1}
                </span>
                <h3 className="font-editorial text-2xl font-bold text-ink">
                  {pillar.title}
                </h3>
                <p className="text-muted leading-relaxed text-sm sm:text-base">
                  {pillar.description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-ink/5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-dark">
                <span>Obsessive Standard</span>
                <span className="text-copper" aria-hidden="true">→</span>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
