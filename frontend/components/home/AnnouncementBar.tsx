import { Container } from "@/components/ui/Container";
import { messages } from "@/messages/en";

export function AnnouncementBar() {
  return (
    <aside aria-label="Announcement" className="border-b border-cream/10 bg-charcoal py-2 text-xs text-cream/90">
      <Container className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 truncate">
          <span className="h-1.5 w-1.5 rounded-full bg-copper shrink-0 animate-pulse" aria-hidden="true" />
          <span className="font-medium tracking-wide uppercase">{messages.home.announcement}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-cream/70 text-xs">
          <span>Freshly Grilled</span>
          <span>•</span>
          <span>Pick-up & Direct Delivery</span>
        </div>
      </Container>
    </aside>
  );
}
