"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminAuth } from "@/features/admin/AuthContext";
import { useAdminLive } from "@/features/admin/LiveContext";
import { adminText } from "@/messages/admin";
import { messages } from "@/messages/en";

export function AdminTopbar() {
  const router = useRouter();
  const { admin, signOut } = useAdminAuth();
  const { soundEnabled, toggleSound } = useAdminLive();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/admin/login");
  };

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 bg-surface/90 backdrop-blur-md px-4 py-3.5 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <p className="font-editorial text-xl sm:text-2xl font-bold text-ink">
          {messages.admin.title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {/* Sound alerts toggle */}
        <Button
          variant={soundEnabled ? "gold" : "secondary"}
          size="sm"
          aria-pressed={soundEnabled}
          onClick={toggleSound}
          className="text-xs"
        >
          <span aria-hidden="true">{soundEnabled ? "🔔" : "🔕"}</span>
          <span>{soundEnabled ? adminText.shell.soundOn : adminText.shell.soundOff}</span>
        </Button>

        {/* Signed-in identity */}
        {admin && (
          <Badge variant="neutral" size="sm">
            {admin.email}
          </Badge>
        )}

        {/* Quick storefront preview */}
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-orange-dark hover:underline"
        >
          <span>{messages.admin.viewSite}</span>
          <span aria-hidden="true">↗</span>
        </Link>

        {/* Sign out */}
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs">
          {adminText.shell.signOut}
        </Button>
      </div>
    </header>
  );
}
