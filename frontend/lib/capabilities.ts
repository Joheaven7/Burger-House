export type Skip3DReason = "reduced-motion" | "save-data" | "slow-connection" | "no-webgl";

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    // Release the test context so it does not count against the browser's limit
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Returns why 3D should be skipped, or null if 3D is allowed. Browser only. */
export function getSkip3DReason(): Skip3DReason | null {
  if (typeof window === "undefined") return null;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced-motion";

  // Not every browser supports this hint, so the frame-rate fallback is the safety net.
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (connection?.saveData) return "save-data";
  if (connection?.effectiveType && ["slow-2g", "2g"].includes(connection.effectiveType)) {
    return "slow-connection";
  }

  if (!hasWebGL()) return "no-webgl";
  return null;
}

/** True on phones and tablets (finger instead of mouse). */
export function isCoarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}