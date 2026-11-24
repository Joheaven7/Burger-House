import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      {/* LoginForm reads the address (?next=...), which needs a Suspense boundary */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}