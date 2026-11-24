"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ADMIN_UNAUTHORIZED_EVENT } from "@/lib/admin-api";
import { fetchMe, loginAdmin, logoutAdmin } from "@/services/admin";
import type { AdminUser } from "@/types/admin";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthValue {
  status: AuthStatus;
  admin: AdminUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reload: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Ask the server who is signed in (the session lives in an HttpOnly cookie that JavaScript cannot read)
  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        setAdmin(me);
        setStatus(me ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Any admin request answered with 401 sends us back to the login page
  useEffect(() => {
    const onUnauthorized = () => {
      setAdmin(null);
      setStatus("unauthenticated");
    };
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const me = await loginAdmin(email, password);
    setAdmin(me);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      setAdmin(null);
      setStatus("unauthenticated");
    }
  }, []);

  const reload = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ status, admin, signIn, signOut, reload }),
    [status, admin, signIn, signOut, reload],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return context;
}