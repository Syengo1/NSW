'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderPoller({ stop }: { stop: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (stop) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [router, stop]);

  return null;
}