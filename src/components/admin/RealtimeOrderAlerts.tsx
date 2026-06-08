'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function RealtimeOrderAlerts() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // DEBUG 1: Confirms the component is actively running
    console.log("🔌 Realtime Order Listener Mounted");

    const channel = supabase
      .channel('admin-order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // DEBUG 2: Prints the exact data arriving from the database
          console.log("🔔 RAW REALTIME PAYLOAD RECEIVED:", payload);

          const oldRecord = payload.old;
          const newRecord = payload.new;

          // Defensive Check: Fallback if old status is ever missing
          const oldStatus = oldRecord?.status;
          const newStatus = newRecord?.status;

          const justPaid = 
            (oldStatus === 'pending_payment' || !oldStatus) && 
            (newStatus === 'paid' || newStatus === 'processing');

          if (justPaid) {
            const audio = new Audio('/notification.mp3');
            audio.play().catch((e) => console.log("Audio autoplay blocked by browser:", e)); 

            toast.success(`Payment Secured: ${newRecord.order_number}`, {
              description: `${newRecord.customer_name} just paid ${formatCurrency(newRecord.total_amount / 100)}.`,
              icon: <CheckCircle2 className="text-emerald-500 animate-pulse" />,
              duration: 15000, 
              position: 'top-right',
              action: {
                label: 'Fulfill Order',
                onClick: () => {
                  router.push(`/admin/orders?highlight=${newRecord.id}`);
                },
              },
            });
          }
        }
      )
      .subscribe((status) => {
        // DEBUG 3: Confirms the WebSocket connected successfully
        console.log("📡 Supabase Realtime Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null; 
}