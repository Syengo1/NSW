import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 1. PERFORMANCE: Enable AVIF for world-class image compression (20% smaller than WebP)
    formats: ['image/avif', 'image/webp'],
    
    // 2. SECURITY: Strictly whitelist only your exact CDNs and buckets
    remotePatterns: [
      {
        protocol: 'https',
        // Your specific Supabase instance (pulled from your Lighthouse audit)
        hostname: 'wqrtjgfrjuadksaotbxj.supabase.co', 
        port: '',
        // Restricts access to ONLY the public storage bucket
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        // Your Vercel Blob Storage (where your hero video and assets live)
        hostname: 'ewxf0eupwexd82yb.public.blob.vercel-storage.com',
        port: '',
      }
    ],
  },
  
  // 3. PRODUCTION CLEANUP: Automatically strip console.log() in production
  // This reduces bundle size and hides debugging info from users inspecting your site.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } // Keeps errors/warnings, but removes standard logs
      : false,
  },
};

export default nextConfig;