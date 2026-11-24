import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { messages } from "@/messages/en";
import { getPublicSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: messages.checkout.title,
  description: "Complete your contact and delivery details to place your order with Burger House.",
};

export default async function OrderPage() {
  const settings = await getPublicSettings();

  return (
    <Container className="space-y-8 py-10 sm:py-16">
      <header className="space-y-3 max-w-xl">
        <Badge variant="gold" size="sm" dot>
          Guest Checkout
        </Badge>
        <h1 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          {messages.checkout.title}
        </h1>
        <p className="text-base text-muted">
          No account needed. Enter your contact details below to send your order directly to the kitchen.
        </p>
      </header>

      <CheckoutForm settings={settings} />
    </Container>
  );
}
