import type { NextConfig } from "next";

// "Proxy mode": until the restaurant has its own domain, the browser calls /api on the website's own address
// and Vercel forwards those requests to the backend. That makes the admin login cookie first-party and safe.
// (With a custom domain you would set NEXT_PUBLIC_API_BASE_URL to the API address instead and skip this.)
const proxyApi = process.env.NEXT_PUBLIC_API_BASE_URL === "/api";
const backendOrigin = (process.env.API_INTERNAL_URL ?? "").replace(/\/api\/?$/, "");

if (proxyApi && !backendOrigin) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is "/api" (proxy mode), so API_INTERNAL_URL must be set to the backend address, for example https://my-api.onrender.com/api');
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    if (!proxyApi) return [];
    return [{ source: "/api/:path*", destination: `${backendOrigin}/api/:path*` }];
  },
};

export default nextConfig;