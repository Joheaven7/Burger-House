import { Badge } from "@/components/ui/Badge";
import { messages } from "@/messages/en";

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <Badge variant={available ? "success" : "danger"} size="sm" dot>
      {available ? messages.menu.available : messages.menu.soldOut}
    </Badge>
  );
}
