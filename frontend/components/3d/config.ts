export const CAMERA_POSITION: [number, number, number] = [0, 0.6, 5.2];
export const MAX_DPR_DESKTOP = 2; // cap on sharpness, protects the GPU
export const MAX_DPR_TOUCH = 1.5;

export interface PointerPosition {
  x: number; // -1 (left) to 1 (right)
  y: number; // -1 (bottom) to 1 (top)
}

export type PointerRef = { current: PointerPosition };