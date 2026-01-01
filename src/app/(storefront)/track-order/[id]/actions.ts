'use server';

import { createClient } from "@supabase/supabase-js"; 
import { initiateSTKPush } from '@/lib/services/mpesa';
import { revalidatePath } from 'next/cache';

export async function retryPayment(orderId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) throw new Error("Order not found");

  try {
    const res = await initiateSTKPush(order.customer_phone, order.total_amount / 100, order.id);
    
    await supabase
      .from('orders')
      .update({ mpesa_request_id: res.checkoutRequestId, status: 'processing' })
      .eq('id', order.id);

    revalidatePath(`/track-order/${orderId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}