import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from 'next/cache';

// --- SECURITY CONFIGURATION ---
// These are the official Safaricom M-Pesa API IP addresses.
// Sources: Safaricom Developer Docs & Network Engineering Analysis.
const SAFARICOM_IPS = new Set([
  "196.201.214.200", "196.201.214.206", "196.201.213.114",
  "196.201.214.207", "196.201.214.208", "196.201.213.44",
  "196.201.212.127", "196.201.212.138", "196.201.212.129",
  "196.201.212.136", "196.201.212.74",  "196.201.212.69"
]);

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. SECURITY: IP WHITELIST CHECK
    // In Vercel/Next.js, 'x-forwarded-for' often contains a chain of IPs. 
    // We take the first one (the client IP).
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'UNKNOWN';

    // Allow loopback for local testing (optional, remove in strict production)
    const isLocal = process.env.NODE_ENV === 'development' && (clientIp === '::1' || clientIp === '127.0.0.1');

    if (!isLocal && !SAFARICOM_IPS.has(clientIp)) {
      console.error(JSON.stringify({
        event: 'SECURITY_ALERT',
        message: 'Unauthorized IP attempted to access M-Pesa Callback',
        ip: clientIp,
        headers: Object.fromEntries(request.headers)
      }));
      // Respond with 403 Forbidden to block the attack
      return NextResponse.json({ message: "Access Denied" }, { status: 403 });
    }

    // 2. SECURITY: SECRET TOKEN VERIFICATION
    // Update your STK Push callback URL to: https://your-site.com/api/mpesa/callback?secret=YOUR_ENV_SECRET
    const urlSecret = request.nextUrl.searchParams.get('secret');
    const envSecret = process.env.MPESA_CALLBACK_SECRET;

    if (envSecret && urlSecret !== envSecret) {
      console.error(JSON.stringify({
        event: 'SECURITY_ALERT',
        message: 'Invalid Secret Token',
        providedSecret: urlSecret ? '***REDACTED***' : 'MISSING'
      }));
      return NextResponse.json({ message: "Invalid Signature" }, { status: 401 });
    }

    const body = await request.json();

    // 3. INPUT VALIDATION (Defensive Programming)
    if (!body?.Body?.stkCallback) {
      console.warn(JSON.stringify({ event: 'INVALID_PAYLOAD', body }));
      return NextResponse.json({ message: "Invalid Payload Structure" }, { status: 400 });
    }

    const { 
      CheckoutRequestID, 
      ResultCode, 
      CallbackMetadata 
    } = body.Body.stkCallback;

    // 4. INIT ADMIN CLIENT (Bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      { auth: { persistSession: false } }
    );

    // 5. FETCH ORDER & IDEMPOTENCY CHECK
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, customer_phone')
      .eq('mpesa_request_id', CheckoutRequestID)
      .single();

    if (!existingOrder) {
      console.error(JSON.stringify({
        event: 'ORPHAN_CALLBACK',
        message: 'Callback received for unknown order',
        checkoutRequestId: CheckoutRequestID
      }));
      // Return 200 to Safaricom so they stop retrying (it's not their fault we lost the order)
      return NextResponse.json({ message: "Order not found, logged for investigation" });
    }

    // Idempotency: If already paid or failed, don't re-process
    if (['paid', 'failed'].includes(existingOrder.status)) {
      console.log(JSON.stringify({
        event: 'DUPLICATE_CALLBACK',
        orderId: existingOrder.id,
        status: existingOrder.status
      }));
      return NextResponse.json({ message: "Already processed" });
    }

    // 6. LOGIC: TRANSACTION PROCESSING
    const isSuccess = ResultCode === 0;

    if (!isSuccess) {
      // --- FAILURE HANDLING (RESTOCK) ---
      console.warn(JSON.stringify({
        event: 'PAYMENT_FAILED',
        orderId: existingOrder.id,
        reason: body.Body.stkCallback.ResultDesc
      }));

      // A. Update Status
      await supabase.from('orders').update({ status: 'failed' }).eq('id', existingOrder.id);

      // B. Restore Stock (Atomic RPC Call)
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', existingOrder.id);

      if (orderItems) {
        for (const item of orderItems) {
          // RPC: decrement_stock(row_id, amount). Passing negative amount adds stock.
          await supabase.rpc('decrement_stock', { 
             row_id: item.variant_id, 
             amount: -Math.abs(item.quantity) 
          });
          
          await supabase.from('inventory_ledger').insert({
             variant_id: item.variant_id,
             quantity_change: item.quantity,
             reason: 'payment_failure_restock',
             reference_id: existingOrder.id
          });
        }
      }
    } else {
      // --- SUCCESS HANDLING ---
      const items = CallbackMetadata?.Item || [];
      const receiptItem = items.find((i: any) => i.Name === "MpesaReceiptNumber");
      const receiptNumber = receiptItem?.Value || "UNKNOWN";
      const amountItem = items.find((i: any) => i.Name === "Amount");
      const paidAmount = amountItem?.Value;

      console.info(JSON.stringify({
        event: 'PAYMENT_SUCCESS',
        orderId: existingOrder.id,
        receipt: receiptNumber,
        amount: paidAmount,
        latency: Date.now() - startTime
      }));

      await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          mpesa_receipt: receiptNumber 
        })
        .eq('id', existingOrder.id);
    }

    // 7. CACHE INVALIDATION
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath(`/track-order/${existingOrder.id}`);

    return NextResponse.json({ message: "Callback processed successfully" });

  } catch (error: any) {
    // 8. GLOBAL ERROR SAFETY
    // Never expose stack traces to the external API response
    console.error(JSON.stringify({
      event: 'CRITICAL_ERROR',
      error: error.message,
      stack: error.stack
    }));
    
    // Return 500 so Safaricom knows to retry later if it was a transient server issue
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}