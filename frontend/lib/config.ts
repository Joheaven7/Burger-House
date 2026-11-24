// Where the backend lives. The browser and the Next.js server may need different addresses:
//  - Browser: NEXT_PUBLIC_API_BASE_URL, for example http://localhost:5000/api, or just "/api" when Vercel forwards
//    /api to the backend ("proxy mode", used until the restaurant has its own domain).
//  - Next.js server: API_INTERNAL_URL, a full https://... address (a server cannot use a relative "/api").
const browserBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const serverBase = process.env.API_INTERNAL_URL || browserBase;

export const API_BASE_URL = typeof window === "undefined" ? serverBase : browserBase;

// Secret shared with the backend so page loads made by our own server skip the per-visitor rate limit.
// It has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the browser.
export const INTERNAL_API_KEY: string | undefined = typeof window === "undefined" ? process.env.INTERNAL_API_KEY || undefined : undefined;