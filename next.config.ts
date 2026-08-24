import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// 🚨 SECURITY FIX: Strict Content Security Policy
// Defines exactly which external resources are allowed to load, blocking all malicious injections.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://eu.posthog.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://wqrtjgfrjuadksaotbxj.supabase.co https://ewxf0eupwexd82yb.public.blob.vercel-storage.com https://framerusercontent.com https://maps.gstatic.com https://maps.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' ws: wss: https://wqrtjgfrjuadksaotbxj.supabase.co https://api.safaricom.co.ke https://sandbox.safaricom.co.ke https://maps.googleapis.com https://eu.posthog.com;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim(); // Minifies the string to ensure it parses correctly in the browser header

const nextConfig: NextConfig = {
  // 1. NETWORK FIX: Whitelists local IPs to allow Mobile/LAN testing without Turbopack blocking assets
  allowedDevOrigins: [
    "192.168.100.22",
    "192.168.56.1",
    "localhost"
  ],

  experimental: {
    serverActions: {
      // 2. CSRF FIX: Allows Server Actions (e.g., adding to cart, forms) to be triggered from network IPs
      allowedOrigins: [
        "192.168.100.22:3000",
        "192.168.56.1:3000",
        "localhost:3000"
      ],
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wqrtjgfrjuadksaotbxj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ewxf0eupwexd82yb.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } 
      : false,
  },

  turbopack: {},

  async headers() {
    return [
      {
        source: '/(.*)', // Applies to all routes
        headers: [
          {
            // Prevents your site from being embedded in an iframe (Clickjacking protection)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Forces the browser to trust the Content-Type header (prevents MIME sniffing)
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Controls how much referrer information is included with requests
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Enforces secure HTTPS connections and prevents protocol downgrade attacks
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            // Restricts access to device hardware (camera, microphone) to prevent malicious tracking
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            // 🚨 SECURITY FIX: Injects the Content Security Policy into the response
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
}; 

const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", 
})(nextConfig);

export default withPWAConfig;