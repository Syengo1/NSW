import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from 'next/cache';

// --- STRICT TYPESCRIPT INTERFACES ---
interface MpesaCallbackItem {
  Name: string;
  Value?: string | number;
}

interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: MpesaCallbackItem[];
      };
    };
  };
}

// --- SECURITY CONFIGURATION ---
const SAFARICOM_IPS = new Set([
  "196.201.214.200", "196.201.214.206", "196.201.213.114",
  "196.201.214.207", "196.201.214.208", "196.201.213.44",
  "196.201.212.127", "196.201.212.138", "196.201.212.129",
  "196.201.212.136", "196.201.212.74",  "196.201.212.69"
]);

// Helper function to extract metadata safely
const getMetadataValue = (items: MpesaCallbackItem[], key: string) => {
  return items.find((item) => item.Name === key)?.Value;
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. SECURITY: IP WHITELIST CHECK
    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'UNKNOWN';

    // Relaxed for local ngrok testing
    const isLocal = process.env.NODE_ENV === 'development';

    if (!isLocal && !SAFARICOM_IPS.has(clientIp)) {
      console.error(JSON.stringify({
        event: 'SECURITY_ALERT',
        message: 'Unauthorized IP attempted to access M-Pesa Callback',
        ip: clientIp
      }));
      return NextResponse.json({ message: "Access Denied" }, { status: 403 });
    }

    // 2. SECURITY: SECRET TOKEN VERIFICATION
    const urlSecret = request.nextUrl.searchParams.get('secret');
    const envSecret = process.env.MPESA_CALLBACK_SECRET;

    if (envSecret && urlSecret !== envSecret) {
      console.error(JSON.stringify({
        event: 'SECURITY_ALERT',
        message: 'Invalid Secret Token provided to M-Pesa Callback'
      }));
      return NextResponse.json({ message: "Invalid Signature" }, { status: 401 });
    }

    // 3. INPUT VALIDATION & TYPING
    const body: MpesaCallbackPayload = await request.json();

    if (!body?.Body?.stkCallback) {
      console.warn(JSON.stringify({ event: 'INVALID_PAYLOAD', body }));
      return NextResponse.json({ message: "Invalid Payload Structure" }, { status: 400 });
    }

    const { 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = body.Body.stkCallback;

    // 4. INIT ADMIN CLIENT (Bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      { auth: { persistSession: false } }
    );

    // 5. FETCH ORDER & IDEMPOTENCY CHECK
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, status, customer_phone')
      .eq('mpesa_request_id', CheckoutRequestID)
      .single();

    if (orderError || !existingOrder) {
      console.error(JSON.stringify({
        event: 'ORPHAN_CALLBACK',
        message: 'Callback received for unknown order',
        checkoutRequestId: CheckoutRequestID,
        error: orderError?.message
      }));
      return NextResponse.json({ message: "Order not found, logged for investigation" });
    }

    if (['paid', 'failed', 'cancelled'].includes(existingOrder.status)) {
      console.info(JSON.stringify({
        event: 'DUPLICATE_CALLBACK',
        orderId: existingOrder.id,
        status: existingOrder.status
      }));
      return NextResponse.json({ message: "Already processed" });
    }

    // 6. LOGIC: TRANSACTION PROCESSING
    const isSuccess = ResultCode === 0;

    if (!isSuccess) {
      // --- FAILURE HANDLING (CONCURRENT RESTOCK) ---
      console.warn(JSON.stringify({
        event: 'PAYMENT_FAILED',
        orderId: existingOrder.id,
        reason: ResultDesc,
        code: ResultCode
      }));

      // A. Update Status
      await supabase.from('orders').update({ status: 'failed' }).eq('id', existingOrder.id);

      // B. Restore Stock Concurrently (Performance Boost)
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', existingOrder.id);

      if (orderItems && orderItems.length > 0) {
        // Execute all DB operations in parallel rather than waiting for each one
        await Promise.all(
          orderItems.map(async (item) => {
            await supabase.rpc('decrement_stock', { 
               row_id: item.variant_id, 
               amount: -Math.abs(item.quantity) 
            });
            
            await supabase.from('inventory_ledger').insert({
               variant_id: item.variant_id,
               quantity_change: item.quantity,
               // Dynamically log user cancellation vs insufficient funds
               reason: ResultCode === 1032 ? 'payment_cancelled_by_user' : 'payment_failure_restock',
               reference_id: existingOrder.id
            });
          })
        );
      }
    } else {
      // --- SUCCESS HANDLING ---
      const items = CallbackMetadata?.Item || [];
      const receiptNumber = getMetadataValue(items, "MpesaReceiptNumber") || "UNKNOWN";
      const paidAmount = getMetadataValue(items, "Amount");

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
          mpesa_receipt: String(receiptNumber)
        })
        .eq('id', existingOrder.id);
    }

    // 7. CACHE INVALIDATION
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath(`/track-order/${existingOrder.id}`);

    return NextResponse.json({ message: "Callback processed successfully" });

  } catch (error: unknown) {
    // 8. GLOBAL ERROR SAFETY
    const isError = error instanceof Error;
    console.error(JSON.stringify({
      event: 'CRITICAL_ERROR',
      error: isError ? error.message : 'Unknown error',
      stack: isError ? error.stack : undefined
    }));
    
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}