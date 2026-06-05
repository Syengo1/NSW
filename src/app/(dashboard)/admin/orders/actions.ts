'use server';

// FIX 1: We must use the raw @supabase/supabase-js library for the Service Role
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; 
import { revalidatePath } from 'next/cache';

// Helper to create an admin client that bypasses RLS
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // <-- This is the master key that bypasses RLS
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
    .update({ 
      status: 'received',
    })
    .eq('id', orderId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/orders');
}

// --- CANCEL & RESTOCK (Premium Feature) ---
export async function cancelOrder(orderId: string) {
  const supabaseAdmin = getAdminClient();

  // 1. Fetch Order Items to know what to restock
  const { data: items, error: fetchError } = await supabaseAdmin
    .from('order_items')
    .select('variant_id, quantity')
    .eq('order_id', orderId);

  if (fetchError || !items) throw new Error("Could not fetch order items");

  // 2. Restore Stock Loop
  for (const item of items) {
    // Because we are using the Admin Client, this RPC will successfully execute
    const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
      row_id: item.variant_id,
      amount: -Math.abs(item.quantity) // Negative amount = Add Stock
    });

    if (!stockError) {
      // Because we are using the Admin Client, writing to the ledger will successfully execute
      await supabaseAdmin.from('inventory_ledger').insert({
        variant_id: item.variant_id,
        quantity_change: item.quantity,
        reason: 'admin_cancellation',
        reference_id: orderId
      });
    } else {
       console.error("Stock restock error:", stockError);
    }
  }

  // 3. Mark Order as Cancelled
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (updateError) throw new Error(updateError.message);

  // 4. Refresh Views
  revalidatePath('/admin/orders');
  revalidatePath('/admin/products'); 
}