"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { BurgerLighting } from "@/components/3d/BurgerLighting";
import { BurgerModel } from "@/components/3d/BurgerModel";
import { BurgerMotion } from "@/components/3d/BurgerMotion";
import { CameraRig } from "@/components/3d/CameraRig";
import { CAMERA_POSITION, MAX_DPR_DESKTOP, MAX_DPR_TOUCH, type PointerPosition } from "@/components/3d/config";

export interface BurgerSceneProps {
  active: boolean; // false = pause drawing (hero off-screen or tab hidden)
  pointerFollow: boolean; // false on touch devices
  coarsePointer: boolean;
  onReady: () => void;
  onLowPerformance: () => void;
}

export function BurgerScene({ active, pointerFollow, coarsePointer, onReady, onLowPerformance }: BurgerSceneProps) {
  const pointer = useRef<PointerPosition>({ x: 0, y: 0 });
  const declines = useRef(0);
  const [dpr, setDpr] = useState(() =>
    Math.min(window.devicePixelRatio || 1, coarsePointer ? MAX_DPR_TOUCH : MAX_DPR_DESKTOP),
  );

  // Track the mouse across the whole window so the canvas never has to receive pointer events
  useEffect(() => {
    if (!pointerFollow) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [pointerFollow]);

  const handleDecline = useCallback(() => {
    declines.current += 1;
    if (declines.current === 1) setDpr(1); // first drop: lower the sharpness
    else onLowPerformance(); // still slow: give up on 3D
  }, [onLowPerformance]);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ position: CAMERA_POSITION, fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={onReady}
    >
      <PerformanceMonitor bounds={() => [35, 60]} onDecline={handleDecline} />
      <BurgerLighting />
      <CameraRig pointer={pointer} enabled={pointerFollow} />
      <Suspense fallback={null}>
        <BurgerMotion intensity={coarsePointer ? 0.5 : 1}>
          <BurgerModel />
        </BurgerMotion>
      </Suspense>
    </Canvas>
  );
}