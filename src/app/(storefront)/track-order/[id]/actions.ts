'use server';

import { createClient } from "@supabase/supabase-js"; 
import { initiateSTKPush } from '@/lib/services/mpesa';
import { revalidatePath } from 'next/cache';

export async function retryPayment(orderNumber: string) {
  // 1. INIT ADMIN CLIENT (Bypass RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 2. FETCH ORDER
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, customer_phone, total_amount')
    .eq('order_number', orderNumber)
    .single();

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  // 3. SAFETY CHECK: Prevent double payment
  if (order.status === 'paid' || order.status === 'shipped') {
    return { success: false, error: "Order is already paid!" };
  }

  try {
    // 4. TRIGGER M-PESA
    const res = await initiateSTKPush(order.customer_phone, order.total_amount / 100, order.id);
    
    // 5. UPDATE ORDER STATE
    const { error } = await supabase
      .from('orders')
      .update({ 
        mpesa_request_id: res.checkoutRequestId, 
        status: 'processing' // Reset status to processing so UI shows spinner
      })
      .eq('id', order.id);

    if (error) throw new Error("Database update failed");

    revalidatePath(`/track-order/${orderNumber}`);
    return { success: true };

  } catch (e: any) {
    console.error("Retry Payment Error:", e);
    return { success: false, error: e.message || "Failed to initiate M-Pesa." };
  }
}