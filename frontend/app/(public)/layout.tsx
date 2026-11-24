import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CartProvider } from "@/features/cart/CartContext";
import { messages } from "@/messages/en";
import { getPublicSettings } from "@/services/settings";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings();

  return (
    <CartProvider maxQuantityPerLine={settings.maxQuantityPerLine} maxItemsPerOrder={settings.maxItemsPerOrder}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        {messages.common.skipToContent}
      </a>
      <Navbar />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
   <Footer contact={settings.contact} />
    </CartProvider>
  );
}