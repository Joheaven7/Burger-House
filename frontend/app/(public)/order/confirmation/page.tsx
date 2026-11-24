import type { Metadata } from "next";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";
import { Container } from "@/components/ui/Container";
import { messages } from "@/messages/en";

export const metadata: Metadata = {
  title: `${messages.confirmation.title} | ${messages.siteName}`,
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <Container width="narrow" className="py-10 sm:py-16">
      <ConfirmationView />
    </Container>
  );
}
