import { createClient } from '@supabase/supabase-js'; 
import { NextResponse } from "next/server";

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
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // 4. HANDLE FAILED PAYMENT
    if (ResultCode !== 0) {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', existingOrder.id);
      return NextResponse.json({ message: "Logged failure" });
    }

    // 5. HANDLE SUCCESS
    // Extract Receipt Number
    const items = CallbackMetadata?.Item || [];
    const receiptItem = items.find((i: any) => i.Name === "MpesaReceiptNumber");
    const receiptNumber = receiptItem?.Value || "UNKNOWN";

    // A. Update Order
    await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        mpesa_receipt: receiptNumber 
      })
      .eq('id', existingOrder.id);

    // B. Deduct Stock (The Ledger)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('variant_id, quantity')
      .eq('order_id', existingOrder.id);

    if (orderItems) {
      for (const item of orderItems) {
        // 1. Lower Stock Level
        await supabase.rpc('decrement_stock', { 
           row_id: item.variant_id, 
           amount: item.quantity 
        });

        // 2. Add to Ledger
        await supabase.from('inventory_ledger').insert({
          variant_id: item.variant_id,
          quantity_change: -Math.abs(item.quantity),
          reason: 'sale',
          reference_id: existingOrder.id
        });
      }
    }

    return NextResponse.json({ message: "Callback processed" });

  } catch (error) {
    console.error("Callback Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}