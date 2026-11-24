"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getStats } from "@/services/admin";
import type { AdminStats } from "@/types/admin";

const POLL_MS = 20_000; // refresh every 20 seconds (requirement ADM-09: 15 to 30)

interface LiveValue {
  stats: AdminStats | null;
  error: boolean;
  refresh: () => Promise<void>;
  soundEnabled: boolean;
  toggleSound: () => void;
  newOrderBanner: boolean;
  dismissBanner: () => void;
}

const LiveContext = createContext<LiveValue | null>(null);

/**
 * Keeps the dashboard numbers fresh and tells staff when a new order arrives:
 * a banner, a count in the page title and (if switched on) a beep.
 */
export function AdminLiveProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);
  const [banner, setBanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const lastPending = useRef<number | null>(null);
  const soundRef = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const pathname = usePathname();

  const beep = useCallback(() => {
    const context = audio.current;
    if (!context) return;
    void context.resume();
    const tone = (offset: number) => {
      const start = context.currentTime + offset;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    };
    tone(0);
    tone(0.35);
  }, []);

  const applyStats = useCallback(
    (next: AdminStats) => {
      const before = lastPending.current;
      lastPending.current = next.pendingNow;
      if (before !== null && next.pendingNow > before) {
        setBanner(true);
        if (soundRef.current) beep();
      }
      setStats(next);
      setError(false);
    },
    [beep],
  );

  const refresh = useCallback(
    () =>
      getStats()
        .then(applyStats)
        .catch(() => setError(true)),
    [applyStats],
  );

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Show the number of pending orders in the browser tab title, for example "(3) Orders | Admin"
  const pending = stats?.pendingNow ?? 0;
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = pending > 0 ? `(${pending}) ${base}` : base;
  }, [pending, pathname]);

  // Browsers only allow sound after a click, so the staff member switches it on themselves.
  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundEnabled(next);
    if (next) {
      audio.current ??= new AudioContext();
      beep(); // a test beep so they know it works
    }
  }, [beep]);

  const dismissBanner = useCallback(() => setBanner(false), []);

  const value = useMemo<LiveValue>(
    () => ({ stats, error, refresh, soundEnabled, toggleSound, newOrderBanner: banner, dismissBanner }),
    [stats, error, refresh, soundEnabled, toggleSound, banner, dismissBanner],
  );
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useAdminLive(): LiveValue {
  const context = useContext(LiveContext);
  if (!context) throw new Error("useAdminLive must be used inside <AdminLiveProvider>");
  return context;
}