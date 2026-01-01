'use server';

import { createClient } from '@supabase/supabase-js'; // Use Admin Client
import { initiateSTKPush } from '@/lib/services/mpesa';
import { redirect } from 'next/navigation';

type CartItem = {
  variantId: string;
  quantity: number;
};

export async function processCheckout(formData: FormData, cartItems: CartItem[]) {
  // 1. INIT ADMIN CLIENT (Bypass RLS to check stock/create order)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;

  if (cartItems.length === 0) throw new Error("Cart is empty");

  // 2. VALIDATE PRICES & STOCK
  // We must fetch the DB price to prevent frontend tampering
  const { data: variants } = await supabase
    .from('variants')
    .select('id, price_adjustment, sku, stock_quantity, size, color, products(title, base_price)')
    .in('id', cartItems.map(i => i.variantId));

  if (!variants) throw new Error("Inventory check failed");

  let totalCents = 0;
  const orderItemsData = [];

  for (const item of cartItems) {
    const dbVariant = variants.find(v => v.id === item.variantId);
    if (!dbVariant) throw new Error(`Item ${item.variantId} no longer exists`);

    // Stock Check
    if (dbVariant.stock_quantity < item.quantity) {
      throw new Error(`Sold out: ${dbVariant.sku}`);
    }

    // Price Calc (Base + Adjustment)
    const unitPrice = (dbVariant.products as any).base_price + dbVariant.price_adjustment;
    totalCents += unitPrice * item.quantity;

    orderItemsData.push({
      variant_id: dbVariant.id,
      product_name: (dbVariant.products as any).title, // New Schema Field
      variant_name: `${dbVariant.color} / ${dbVariant.size}`, // New Schema Field
      quantity: item.quantity,
      price_at_purchase: unitPrice
    });
  }

  // 3. CREATE ORDER
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: name,
      customer_phone: phone,
      customer_location: address, // New Schema Field
      total_amount: totalCents,
      status: 'pending_payment'
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // 4. SAVE ORDER ITEMS
  const { error: itemsError } = await supabase.from('order_items').insert(
    orderItemsData.map(item => ({ ...item, order_id: order.id }))
  );

  if (itemsError) throw new Error("Failed to save items");

  // 5. TRIGGER M-PESA
  try {
    const res = await initiateSTKPush(phone, totalCents / 100, order.id);
    
    // Save Request ID for tracking
    await supabase
      .from('orders')
      .update({ mpesa_request_id: res.checkoutRequestId })
      .eq('id', order.id);

    return { success: true, orderId: order.id };

  } catch (e: any) {
    console.error("Payment Init Error:", e);
    return { success: false, error: e.message };
  }
}