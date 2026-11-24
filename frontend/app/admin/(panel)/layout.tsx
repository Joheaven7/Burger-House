import { AdminShell } from "@/components/admin/AdminShell";

// Everything in this folder needs a signed-in admin. The login page lives outside it (app/admin/login).
export default function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}