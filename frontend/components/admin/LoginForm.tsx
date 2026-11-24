"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAdminAuth } from "@/features/admin/AuthContext";
import { errorMessage } from "@/lib/api-fields";
import { adminText } from "@/messages/admin";
import { messages } from "@/messages/en";

/** Only allow redirects to pages inside /admin (prevents "open redirect" tricks). */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.startsWith("/admin/login")) return "/admin";
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { status, signIn } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = adminText.login.emailRequired;
    if (!password) nextErrors.password = adminText.login.passwordRequired;
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace(next);
    } catch (error) {
      setFormError(errorMessage(error, adminText.common.unexpected));
      setSubmitting(false);
    }
  };

  return (
    <Card surface="light" padding="lg" className="mx-auto w-full max-w-md space-y-6 border-ink/10 shadow-luxury">
      <div className="space-y-2 text-center sm:text-left">
        <Badge variant="gold" size="sm" dot>
          Restricted Portal
        </Badge>
        <h1 className="font-editorial text-3xl font-bold tracking-tight text-ink">
          {adminText.login.title}
        </h1>
        <p className="text-sm text-muted">{adminText.login.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <div role="alert" className="rounded-card border border-orange-dark bg-orange-dark/10 p-4 text-sm font-semibold text-orange-dark">
            {formError}
          </div>
        )}

        <Input
          id="admin-email"
          label={adminText.login.email}
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          id="admin-password"
          label={adminText.login.password}
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
          {adminText.login.submit}
        </Button>
      </form>

      <div className="border-t border-ink/10 pt-4 text-center">
        <Link href="/" className="text-xs font-semibold text-muted hover:text-orange-dark transition-colors">
          ← {messages.common.backHome}
        </Link>
      </div>
    </Card>
  );
}
