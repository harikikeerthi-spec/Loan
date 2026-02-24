import type { NextConfig } from "next";

// Compose `allowedDevOrigins` from an env var for flexibility in previews.
const envAllowed = process.env.ALLOWED_DEV_ORIGINS ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : [];
const defaultAllowed = ['https://syracuse-cathedral-mixing-announcements.trycloudflare.com'];
const allowedDevOrigins = Array.from(new Set([...envAllowed, ...defaultAllowed]));

const nextConfig: NextConfig = {
  // Allow specific dev origins to request Next.js assets in development.
  // Use the ALLOWED_DEV_ORIGINS env var (comma-separated) to add more without changing code.
  allowedDevOrigins,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "img.icons8.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/:path*",
      },
    ];
  },
};

export default nextConfig;
