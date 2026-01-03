import { createClient } from '@supabase/supabase-js'; 
import { NextResponse } from "next/server";
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. VALIDATE PAYLOAD
    if (!body.Body?.stkCallback) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const { 
      CheckoutRequestID, 
      ResultCode, 
      CallbackMetadata 
    } = body.Body.stkCallback;

    // 2. INIT ADMIN CLIENT (Bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      { auth: { persistSession: false } }
    );

    // 3. FETCH ORDER
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('mpesa_request_id', CheckoutRequestID)
      .single();

    if (!existingOrder) {
      // Order might not exist or duplicate callback
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // 4. HANDLE FAILED PAYMENT (CRITICAL LOGIC)
    if (ResultCode !== 0) {
      console.log(`Payment Failed/Cancelled for ${existingOrder.id}. Restoring Stock.`);
      
      // A. Mark Order as Failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', existingOrder.id);

      // B. RESTORE STOCK (Reverse the Reservation)
      // Since the Trigger already deducted stock at checkout, we must put it back now.
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', existingOrder.id);

      if (orderItems) {
        for (const item of orderItems) {
          // We use the existing 'decrement_stock' function with a NEGATIVE number
          // decrement(row_id, -2) === stock - (-2) === stock + 2
          await supabase.rpc('decrement_stock', { 
             row_id: item.variant_id, 
             amount: -Math.abs(item.quantity) 
          });
          
          // Log the Restock in Ledger
          await supabase.from('inventory_ledger').insert({
             variant_id: item.variant_id,
             quantity_change: item.quantity, // Positive number (Adding back)
             reason: 'payment_failed_restock',
             reference_id: existingOrder.id
          });
        }
      }

      // C. Refresh Admin Data
      revalidatePath('/admin/orders');
      revalidatePath('/admin/products');

      return NextResponse.json({ message: "Logged failure & Restocked" });
    }

    // 5. HANDLE SUCCESS (PAYMENT CONFIRMED)
    // Extract Receipt Number
    const items = CallbackMetadata?.Item || [];
    const receiptItem = items.find((i: any) => i.Name === "MpesaReceiptNumber");
    const receiptNumber = receiptItem?.Value || "UNKNOWN";

    // A. Update Status to PAID
    // NOTE: We do NOT deduct stock here. The Database Trigger already did it when the order was created.
    await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        mpesa_receipt: receiptNumber 
      })
      .eq('id', existingOrder.id);

    // B. Refresh Admin Data (Live Updates)
    // This tells Next.js to purge the cache for these pages, so the Admin sees the new data instantly.
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath(`/track-order/${existingOrder.id}`);

    return NextResponse.json({ message: "Callback processed successfully" });

  } catch (error) {
    console.error("Callback Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}