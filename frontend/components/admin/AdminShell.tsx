"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminAuth } from "@/features/admin/AuthContext";
import { AdminLiveProvider, useAdminLive } from "@/features/admin/LiveContext";
import { adminText } from "@/messages/admin";

function NewOrderBanner() {
  const { newOrderBanner, dismissBanner, error } = useAdminLive();
  return (
    <div className="print:hidden">
      {error && (
        <p role="status" className="bg-ink px-4 py-2 text-sm text-cream sm:px-6 lg:px-8">
          {adminText.shell.liveError}
        </p>
      )}
      {newOrderBanner && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 bg-mustard px-4 py-3 font-semibold text-ink sm:px-6 lg:px-8">
          <span>{adminText.shell.newOrder}</span>
          <span className="flex items-center gap-2">
            <Link href="/admin/orders" onClick={dismissBanner} className="underline">
              {adminText.shell.viewOrders}
            </Link>
            <Button variant="ghost" onClick={dismissBanner}>
              {adminText.shell.dismiss}
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}

/** Everything inside the admin area except the login page: it checks the session, then shows the dashboard frame. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { status, reload } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status === "error") {
    return (
      <div className="p-8">
        <ErrorState title={adminText.shell.sessionErrorTitle} message={adminText.shell.sessionErrorText} onRetry={reload} />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label={adminText.shell.checkingSession} />
      </div>
    );
  }

  return (
    <AdminLiveProvider>
      <div className="min-h-screen lg:flex">
        <div className="print:hidden lg:w-60 lg:shrink-0">
          <AdminSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="print:hidden">
            <AdminTopbar />
          </div>
          <NewOrderBanner />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminLiveProvider>
  );
}