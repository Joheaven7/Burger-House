"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { CAMERA_POSITION, type PointerRef } from "@/components/3d/config";

interface CameraRigProps {
  pointer: PointerRef;
  enabled: boolean;
}

export function CameraRig({ pointer, enabled }: CameraRigProps) {
  useFrame((state, delta) => {
    const { camera } = state;
    const px = enabled ? MathUtils.clamp(pointer.current.x, -1, 1) : 0;
    const py = enabled ? MathUtils.clamp(pointer.current.y, -1, 1) : 0;

    // damp() eases toward the target so movement is smooth and frame-rate independent
    camera.position.x = MathUtils.damp(camera.position.x, px * 0.6, 3, delta);
    camera.position.y = MathUtils.damp(camera.position.y, CAMERA_POSITION[1] + py * 0.35, 3, delta);
    camera.lookAt(0, 0, 0);
  });

  return null;
}