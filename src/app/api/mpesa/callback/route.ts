// src/app/api/mpesa/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from 'next/cache';
import { sendAdminTelegramAlert } from "@/lib/services/notifications";

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
    // Expanded fetch to pull data required for the Telegram dispatch receipt
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, 
        status, 
        order_number, 
        customer_name, 
        customer_phone, 
        total_amount,
        delivery_method,
        customer_location,
        delivery_coordinates,
        recipient_name,
        recipient_phone,
        order_items (
          quantity,
          product_name,
          variant_name
        )
      `)
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
      // --- FAILURE HANDLING ---
      console.warn(JSON.stringify({
        event: 'PAYMENT_FAILED',
        orderId: existingOrder.id,
        reason: ResultDesc,
        code: ResultCode
      }));

      // A. Update Status
      // The database trigger `on_order_failed_restock` will automatically 
      // intercept this update, restock the variants, and log the ledger!
      await supabase.from('orders').update({ status: 'failed' }).eq('id', existingOrder.id);

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

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          mpesa_receipt: String(receiptNumber)
        })
        .eq('id', existingOrder.id);

      // Trigger Telegram Dispatch as a floating promise. 
      // Do not use 'await' here so Safaricom gets their 200 OK instantly.
      if (!updateError) {
        await sendAdminTelegramAlert({
          orderNumber: existingOrder.order_number,
          amount: existingOrder.total_amount,
          receiptNumber: String(receiptNumber),
          customerName: existingOrder.customer_name,
          customerPhone: existingOrder.customer_phone,
          recipientName: existingOrder.recipient_name,
          recipientPhone: existingOrder.recipient_phone,
          deliveryMethod: existingOrder.delivery_method,
          location: existingOrder.customer_location,
          coordinates: existingOrder.delivery_coordinates,
          items: (existingOrder.order_items as unknown) as Array<{
            quantity: number;
            product_name: string;
            variant_name: string;
          }>
          
        }).catch(err => console.error("Telegram Alert Failed:", err));
      }
    }

    // 7. CACHE INVALIDATION
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath(`/track-order/${existingOrder.order_number}`); // Tracking links use order_number, not id

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