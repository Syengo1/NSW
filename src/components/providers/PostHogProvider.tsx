'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// --- 1. THE TRACKER LOGIC ---
function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

// --- 2. THE SUSPENSE WRAPPER (CRITICAL NEXT.JS FIX) ---
// 🚨 PERFORMANCE FIX: Wrapping useSearchParams in Suspense prevents Next.js from 
// de-optimizing the entire application into Server-Side Rendering (SSR).
// This single wrapper restores your Stale-While-Revalidate (ISR) Edge Caching.
export function PostHogPageview() {
  return (
    <Suspense fallback={null}>
      <PostHogPageviewTracker />
    </Suspense>
  );
}

// --- 3. THE MAIN PROVIDER ---
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    // 🚨 CPU / LCP FIX: By moving the initialization inside a useEffect, 
    // PostHog will wait until the browser has fully painted the storefront 
    // before it boots up. This entirely clears the "Legacy JS" main-thread block.
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
        person_profiles: 'always', 
        capture_pageview: false, 
        capture_pageleave: true,
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}