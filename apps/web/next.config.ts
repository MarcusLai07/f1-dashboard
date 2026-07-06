import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // `next build` and `next dev` share .next/ by default, so running a
  // production build while the dev server is up corrupts its chunk graph
  // (Cannot find module './NNNN.js'). `npm run build:check` sets this env
  // to build into an isolated directory instead.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.formula1.com",
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: ["lucide-react", "animejs", "@radix-ui/react-icons"],
  },

  // Headers for PWA
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
