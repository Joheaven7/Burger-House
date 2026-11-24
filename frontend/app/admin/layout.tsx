import type { Metadata } from "next";
import { AdminAuthProvider } from "@/features/admin/AuthContext";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}