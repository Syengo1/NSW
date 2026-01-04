import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'base.co', // Fixes your specific error
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Required for Hero images
      },
      {
        protocol: 'https',
        hostname: 'cdn.coverr.co', // Required for video posters if optimized
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Wildcard to allow any Supabase project URL
      },
    ],
  },
};

export default nextConfig;