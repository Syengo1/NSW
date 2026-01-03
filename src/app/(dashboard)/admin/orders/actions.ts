'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- UPDATE STATUS ---
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/orders');
}

// --- CANCEL & RESTOCK (Premium Feature) ---
// This ensures inventory stays accurate even when orders fail or are cancelled manually.
export async function cancelOrder(orderId: string) {
  const supabase = await createClient();

  // 1. Fetch Order Items to know what to restock
  const { data: items, error: fetchError } = await supabase
    .from('order_items')
    .select('variant_id, quantity')
    .eq('order_id', orderId);

  if (fetchError || !items) throw new Error("Could not fetch order items");

  // 2. Restore Stock Loop
  for (const item of items) {
    // We use the existing 'decrement_stock' RPC with a negative number to INCREMENT (Restock)
    // This maintains data integrity by reusing your secure database function.
    const { error: stockError } = await supabase.rpc('decrement_stock', {
      row_id: item.variant_id,
      amount: -Math.abs(item.quantity) // Negative amount = Add Stock
    });

    if (!stockError) {
      // Log the restocking event for audit trails
      await supabase.from('inventory_ledger').insert({
        variant_id: item.variant_id,
        quantity_change: item.quantity,
        reason: 'admin_cancellation',
        reference_id: orderId
      });
    }
  }

  // 3. Mark Order as Cancelled
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (updateError) throw new Error(updateError.message);

  // 4. Refresh Views
  revalidatePath('/admin/orders');
  revalidatePath('/admin/products'); // Update inventory counts immediately
}