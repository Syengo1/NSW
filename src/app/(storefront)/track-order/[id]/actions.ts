// src/app/(storefront)/track-order/[id]/actions.ts
'use server';

import { createClient } from "@supabase/supabase-js"; 
import { initiateSTKPush } from '@/lib/services/mpesa';
import { revalidatePath } from 'next/cache';

export async function retryPayment(orderId: string) {
  // 1. INIT ADMIN CLIENT (Bypass RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // 2. FETCH ORDER
    // FIX: Query by 'id', since the frontend passes the UUID to this action
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, status, customer_phone, total_amount')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error("[Retry Payment] Order fetch failed:", fetchError);
      return { success: false, error: "Order not found." };
    }

    // 3. SAFETY CHECK: Prevent double payment
    if (['paid', 'shipped', 'delivered'].includes(order.status)) {
      return { success: false, error: "Order is already paid!" };
    }

    // 4. TRIGGER M-PESA
    const res = await initiateSTKPush(order.customer_phone, order.total_amount / 100, order.id);
    
    // 5. UPDATE ORDER STATE
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        mpesa_request_id: res.checkoutRequestId, 
        status: 'processing' // Reset status to processing so UI updates
      })
      .eq('id', order.id);

    if (updateError) {
      console.error("[Retry Payment] Order update failed:", updateError);
      throw new Error("Failed to update order status.");
    }

    // Revalidate the page so the user sees the new polling state
    revalidatePath(`/track-order/${order.order_number}`);

    return { success: true };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Payment initiation failed.";
    console.error("[Retry Payment Critical Error]:", error);
    return { success: false, error: errorMessage };
  }
}