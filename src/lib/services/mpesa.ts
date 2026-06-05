// --- CONFIGURATION & TYPES ---
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';

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

// --- MODULE STATE (Serverless In-Memory Cache) ---
// This bypasses Next.js aggressive caching but persists across hot-reloads and warm lambdas
let cachedToken: string | null = null;
let tokenExpiryTime: number | null = null;

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
  const { timeout = 9000 } = options; // 15 Second strict timeout
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
  // 1. Return cached token if it exists and is still valid (Buffer of 5 minutes)
  const now = Date.now();
  if (cachedToken && tokenExpiryTime && now < tokenExpiryTime - 300000) {
    return cachedToken;
  }

  const consumerKey = getEnvVar("MPESA_CONSUMER_KEY");
  const consumerSecret = getEnvVar("MPESA_CONSUMER_SECRET");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const res = await fetchWithTimeout(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store', // Crucial: Never let Next.js cache this network request
      timeout: 10000 // 10 seconds timeout for auth
    });

    if (!res.ok) {
      const errorData: MpesaErrorResponse = await res.json().catch(() => ({}));
      throw new Error(errorData.errorMessage || `Auth failed with status ${res.status}`);
    }

    const data: MpesaTokenResponse = await res.json();
    
    // 2. Update In-Memory Cache (Expires in exactly what Safaricom dictates, usually 3599s)
    cachedToken = data.access_token;
    tokenExpiryTime = now + (parseInt(data.expires_in) * 1000);

    return cachedToken;
  } catch (error) {
    console.error("[MPESA_AUTH_ERROR]", error);
    throw new Error("Payment Gateway is currently unreachable. Please try again in a moment.");
  }
}

export async function initiateSTKPush(phoneNumber: string, amount: number, orderId: string) {
  // 1. Strict Input Validation
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error("Invalid payment amount. Must be a positive integer.");
  }
  
  const formattedPhone = formatAndValidatePhone(phoneNumber);

  try {
    const token = await getAccessToken();
    
    // --- ADD THE TILL NUMBER VARIABLE HERE ---
    const shortcode = getEnvVar("MPESA_SHORTCODE");
    const tillNumber = getEnvVar("MPESA_TILL_NUMBER"); 
    const passkey = getEnvVar("MPESA_PASSKEY");
    const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
    const callbackSecret = getEnvVar("MPESA_CALLBACK_SECRET");

    // YYYYMMDDHHmmss strict formatting
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    
    // Password MUST be generated using the Store Number (shortcode), NOT the Till Number
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: shortcode, // The 7-digit Store Number
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline", 
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      
      // --- UPDATE PARTY_B TO USE THE TILL NUMBER ---
      PartyB: tillNumber, 
      
      PhoneNumber: formattedPhone,
      CallBackURL: `${appUrl}/api/mpesa/callback?secret=${callbackSecret}`,
      AccountReference: "opfits",
      TransactionDesc: `Order ${orderId}`
    };

    const res = await fetchWithTimeout(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      timeout: 15000 // Give the STK prompt 15 seconds to initiate
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
    // 2. Safe Error Propagation
    const isError = error instanceof Error;
    console.error("[STK_PUSH_CRITICAL]", isError ? error.message : error);
    
    // Pass a safe, clean string to the frontend UI
    throw new Error(isError ? error.message : "Payment initiation failed. Please try again.");
  }
}