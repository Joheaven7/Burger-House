import type { Metadata } from "next";
import { Inter, Oswald, Playfair_Display } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { messages } from "@/messages/en";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const description = "Crafted to Crave. Handcrafted gourmet burgers and online ordering for Burger House.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${messages.siteName} | Crafted to Crave`, template: `%s | ${messages.siteName}` },
  description,
  openGraph: { type: "website", siteName: messages.siteName, title: messages.siteName, description },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${oswald.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="bg-cream font-body text-ink antialiased selection:bg-orange/20 selection:text-orange-dark">
        {children}
      </body>
    </html>
  );
}
