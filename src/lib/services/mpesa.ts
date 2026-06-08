// src/lib/services/mpesa.ts
import { Buffer } from 'buffer';

// --- CONFIGURATION & TYPES ---
const MPESA_ENV = process.env.MPESA_ENV || 'production';

const BASE_URL = MPESA_ENV === 'production' 
  ? "https://api.safaricom.co.ke" 
  : "https://sandbox.safaricom.co.ke";

// Strict API Response Types
interface MpesaTokenResponse {
  access_token: string;
  expires_in: string;
}

interface MpesaErrorResponse {
  requestId?: string;
  errorCode?: string;
  errorMessage?: string;
  ResponseDescription?: string;
}

// --- 🚨 GLOBAL MEMORY CACHE (Bypasses Next.js SWR Trap) ---
// By attaching this to globalThis, the cache survives Next.js development hot-reloads
// but avoids the dangerous persistent disk caching of Next.js 'fetch'.
const globalForMpesa = globalThis as unknown as {
  mpesaToken: string | null;
  mpesaTokenExpiry: number | null;
};

// --- UTILITIES ---
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`CRITICAL: Missing Environment Variable: ${key}`);
  return value;
}

/**
 * Fetch wrapper that strictly enforces a timeout to prevent hanging checkouts
 */
async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 15000 } = options; 
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Safaricom M-Pesa is taking too long to respond. Please try again.");
    }
    throw error;
  }
}

function formatAndValidatePhone(phone: string): string {
  let p = phone.replace(/\D/g, ''); 
  
  if (p.startsWith('0')) p = '254' + p.slice(1);
  else if (!p.startsWith('254')) p = '254' + p;

  if (!/^254(7|1)\d{8}$/.test(p)) {
    throw new Error("Invalid phone number. Must be a valid Kenyan mobile number.");
  }
  
  return p;
}

// --- CORE SERVICES ---
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  // 1. Evaluate Memory Cache. We use a safe buffer of 3 minutes (180,000 ms) 
  // before the token actually expires to request a new one.
  if (
    globalForMpesa.mpesaToken && 
    globalForMpesa.mpesaTokenExpiry && 
    now < globalForMpesa.mpesaTokenExpiry - 180000
  ) {
    return globalForMpesa.mpesaToken;
  }

  const consumerKey = getEnvVar("MPESA_CONSUMER_KEY");
  const consumerSecret = getEnvVar("MPESA_CONSUMER_SECRET");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    // 🚨 cache: 'no-store' FORCES Next.js to never save this to the .next disk cache
    const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store' 
    });

    if (!res.ok) {
      const errorData: MpesaErrorResponse = await res.json().catch(() => ({}));
      throw new Error(errorData.errorMessage || `Auth failed with status ${res.status}`);
    }

    const data: MpesaTokenResponse = await res.json();
    
    // 2. Update Global Memory Cache
    globalForMpesa.mpesaToken = data.access_token;
    globalForMpesa.mpesaTokenExpiry = now + (parseInt(data.expires_in) * 1000);

    return globalForMpesa.mpesaToken;

  } catch (error) {
    console.error("[MPESA_AUTH_ERROR]", error);
    throw new Error("Payment Gateway is currently unreachable. Please try again in a moment.");
  }
}

export async function initiateSTKPush(phoneNumber: string, amount: number, orderId: string) {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error("Invalid payment amount. Must be a positive integer.");
  }
  
  const formattedPhone = formatAndValidatePhone(phoneNumber);

  try {
    const token = await getAccessToken();
    
    const shortcode = getEnvVar("MPESA_SHORTCODE");     
    const tillNumber = getEnvVar("MPESA_TILL_NUMBER");  
    const passkey = getEnvVar("MPESA_PASSKEY");
    const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
    const callbackSecret = getEnvVar("MPESA_CALLBACK_SECRET");

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: shortcode, 
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline", 
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: tillNumber, 
      PhoneNumber: formattedPhone,
      CallBackURL: `${appUrl}/api/mpesa/callback?secret=${callbackSecret}`,
      AccountReference: "OP Fits",
      TransactionDesc: `Order ${orderId}`
    };

    const res = await fetchWithTimeout(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: 'no-store', // STK Pushes must NEVER be cached anywhere
      timeout: 15000 
    });

    const data = await res.json();

    if (!res.ok || data.errorMessage || data.errorCode) {
      console.error("[MPESA_STK_REJECTION]", data);
      throw new Error(data.errorMessage || data.ResponseDescription || "Safaricom rejected the request.");
    }

    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      message: data.ResponseDescription || "Payment prompt sent to your phone."
    };

  } catch (error: unknown) {
    const isError = error instanceof Error;
    console.error("[STK_PUSH_CRITICAL]", isError ? error.message : error);
    throw new Error(isError ? error.message : "Payment initiation failed. Please try again.");
  }
}