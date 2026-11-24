"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { BurgerErrorBoundary } from "@/components/3d/BurgerErrorBoundary";
import { BurgerFallback } from "@/components/3d/BurgerFallback";
import { getSkip3DReason, isCoarsePointer } from "@/lib/capabilities";

// Separate chunk: 3D libraries are only loaded when 3D is verified to run
const BurgerScene = dynamic(() => import("@/components/3d/BurgerScene").then((m) => m.BurgerScene), {
  ssr: false,
});

export function HeroBurger({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enable3D, setEnable3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  // 1) After first paint, when browser is idle, decide whether to initialize 3D
  useEffect(() => {
    if (getSkip3DReason()) return;

    const start = () => {
      setCoarse(isCoarsePointer());
      setEnable3D(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 600);
    return () => window.clearTimeout(id);
  }, []);

  // 2) If the user prefers reduced motion, immediately drop to the static fallback
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      if (query.matches) setEnable3D(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // 3) Pause rendering when the hero canvas is scrolled off-screen
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 4) Pause rendering when the browser tab is hidden
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleReady = useCallback(() => setReady(true), []);
  const handleFailure = useCallback(() => setFailed(true), []);
  const handleError = useCallback((error: Error) => {
    console.warn("3D hero disabled, showing the static burger fallback:", error);
    setFailed(true);
  }, []);

  const show3D = enable3D && !failed;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ touchAction: "pan-y" }}
      className={clsx("relative aspect-square", className)}
    >
      {/* Static vector fallback & loading placeholder */}
      <BurgerFallback
        className={clsx(
          "absolute inset-0 h-full w-full transition-opacity duration-500",
          show3D && ready && "opacity-0",
        )}
      />

      {show3D && (
        <div
          className={clsx(
            "pointer-events-none absolute inset-0 transition-opacity duration-500",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <BurgerErrorBoundary onError={handleError}>
            <BurgerScene
              active={heroVisible && tabVisible}
              pointerFollow={!coarse}
              coarsePointer={coarse}
              onReady={handleReady}
              onLowPerformance={handleFailure}
            />
          </BurgerErrorBoundary>
        </div>
      )}
    </div>
  );
}
