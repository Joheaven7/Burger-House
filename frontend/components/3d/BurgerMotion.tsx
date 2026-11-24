"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

interface BurgerMotionProps {
  children: ReactNode;
  intensity?: number; // 1 = full, 0.5 = gentle (touch devices)
}

export function BurgerMotion({ children, intensity = 1 }: BurgerMotionProps) {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    g.rotation.y += delta * 0.4 * intensity; // slow spin
    g.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.08 * intensity; // float

    // Scroll interaction: tilt the burger as the hero scrolls away
    const scroll = Math.min(window.scrollY / window.innerHeight, 1);
    g.rotation.x = 0.25 + scroll * 0.5;
  });

  return <group ref={group}>{children}</group>;
}