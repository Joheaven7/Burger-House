import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { messages } from "@/messages/en";

export default function NotFound() {
  return (
    <Container className="py-24">
      <EmptyState
        title={messages.common.notFoundTitle}
        description={messages.common.notFoundText}
        action={<ButtonLink href="/">{messages.common.backHome}</ButtonLink>}
      />
    </Container>
  );
}