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

// --- UTILITIES ---

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`CRITICAL: Missing Environment Variable: ${key}`);
  return value;
}

/**
 * Fetch wrapper that strictly enforces a timeout to prevent hanging checkouts
 * Only used for the STK Push, NOT the token generation.
 */
async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 15000 } = options; // 15 Second strict timeout for STK push
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

/**
 * Validates and normalizes to strict Kenyan format: 254XXXXXXXXX (12 digits)
 */
function formatAndValidatePhone(phone: string): string {
  let p = phone.replace(/\D/g, ''); // Strip non-digits
  
  if (p.startsWith('0')) p = '254' + p.slice(1);
  else if (!p.startsWith('254')) p = '254' + p;

  // Strict Kenyan mobile validation (Safaricom, Airtel, Telkom)
  if (!/^254(7|1)\d{8}$/.test(p)) {
    throw new Error("Invalid phone number. Must be a valid Kenyan mobile number.");
  }
  
  return p;
}

// --- CORE SERVICES ---

export async function getAccessToken(): Promise<string> {
  const consumerKey = getEnvVar("MPESA_CONSUMER_KEY");
  const consumerSecret = getEnvVar("MPESA_CONSUMER_SECRET");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3500 } 
    });

    if (!res.ok) {
      const errorData: MpesaErrorResponse = await res.json().catch(() => ({}));
      throw new Error(errorData.errorMessage || `Auth failed with status ${res.status}`);
    }

    const data: MpesaTokenResponse = await res.json();
    return data.access_token;

  } catch (error) {
    console.error("[MPESA_AUTH_ERROR]", error);
    throw new Error("Payment Gateway is currently unreachable. Please try again in a moment.");
  }
}

export async function initiateSTKPush(phoneNumber: string, amount: number, orderId: string) {
  // Strict Input Validation
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error("Invalid payment amount. Must be a positive integer.");
  }
  
  const formattedPhone = formatAndValidatePhone(phoneNumber);

  try {
    const token = await getAccessToken();
    
    // Till & Store Configurations
    const shortcode = getEnvVar("MPESA_SHORTCODE");     // Store Number
    const tillNumber = getEnvVar("MPESA_TILL_NUMBER");  // Till Number
    const passkey = getEnvVar("MPESA_PASSKEY");
    const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
    const callbackSecret = getEnvVar("MPESA_CALLBACK_SECRET");

    // YYYYMMDDHHmmss strict formatting
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    
    // Password MUST be generated using the Store Number (shortcode), NOT the Till Number
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: shortcode, // The Store Number
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline", 
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      
      PartyB: tillNumber, // The Till Number
      
      PhoneNumber: formattedPhone,
      CallBackURL: `${appUrl}/api/mpesa/callback?secret=${callbackSecret}`,
      AccountReference: "Nairobi Streetwear",
      TransactionDesc: `Order ${orderId}`
    };

    const res = await fetchWithTimeout(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: 'no-store', // STK Pushes must NEVER be cached
      timeout: 15000 // 15 seconds to abort if Safaricom hangs
    });

    const data = await res.json();

    // Safaricom occasionally sends 200 OK along with an error payload
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
    // Safe Error Propagation
    const isError = error instanceof Error;
    console.error("[STK_PUSH_CRITICAL]", isError ? error.message : error);
    
    // Pass a safe, clean string to the frontend UI
    throw new Error(isError ? error.message : "Payment initiation failed. Please try again.");
  }
}