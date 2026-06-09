'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js'; 
import { revalidatePath } from 'next/cache';

// Helper to create an admin client that safely bypasses RLS
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );
}

// --- UPDATE STATUS ---
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
}

// --- MARK AS RECEIVED ---
export async function markOrderReceived(orderId: string) {
  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'received' })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
}

// --- 🚨 FLAWLESS CANCEL & RESTOCK ---
export async function cancelOrder(orderId: string) {
  const supabaseAdmin = getAdminClient();

  // 1. Fetch current order status to prevent double-restocks
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) throw new Error("Order not found");

  if (['cancelled', 'failed'].includes(order.status)) {
    throw new Error("Order is already cancelled or failed.");
  }

  const wasPending = order.status === 'pending_payment';

  // 2. Mark Order as Cancelled (Execute first to prevent race conditions)
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (updateError) throw new Error(updateError.message);

  // 3. CONDITIONAL RESTOCK LOGIC
  // If the order was 'pending_payment', the PostgreSQL trigger 'on_order_failed_restock' 
  // automatically intercepted the status update above and restocked it. 
  // We ONLY run the manual loop if the order had progressed past pending (e.g., 'paid').
  if (!wasPending) {
    const { data: items, error: fetchError } = await supabaseAdmin
      .from('order_items')
      .select('variant_id, quantity')
      .eq('order_id', orderId);

    if (fetchError || !items) throw new Error("Could not fetch order items for restock");

    for (const item of items) {
      const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
        row_id: item.variant_id,
        amount: -Math.abs(item.quantity) // Negative amount adds stock
      });

      if (!stockError) {
        await supabaseAdmin.from('inventory_ledger').insert({
          variant_id: item.variant_id,
          quantity_change: item.quantity,
          reason: 'admin_refund_restock',
          reference_id: orderId
        });
      } else {
         console.error("[CRITICAL DB ERROR] Refund stock restock failed:", stockError);
      }
    }
  }

  revalidatePath('/admin/orders');
}