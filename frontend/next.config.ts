import type { NextConfig } from "next";

// API_URL is the origin of the backend (no trailing slash, no /api suffix).
// In dev this points to the local uvicorn server on :8000. In production
// (Vercel) it should be set via the NEXT_PUBLIC_API_URL env var to the
// Railway public URL, e.g. https://safewalk-backend.up.railway.app
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
