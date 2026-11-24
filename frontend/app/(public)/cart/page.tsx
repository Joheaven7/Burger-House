import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { messages } from "@/messages/en";

export const metadata: Metadata = {
  title: messages.cart.title,
  description: "Review your handcrafted burger order and proceed to checkout.",
};

export default function CartPage() {
  return (
    <Container className="space-y-8 py-10 sm:py-16">
      <header className="space-y-3 max-w-xl">
        <Badge variant="gold" size="sm" dot>
          Your Selection
        </Badge>
        <h1 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          {messages.cart.title}
        </h1>
        <p className="text-base text-muted">
          Review your handcrafted items. Final pricing and live availability are verified by the kitchen.
        </p>
      </header>

      <CartView />
    </Container>
  );
}
