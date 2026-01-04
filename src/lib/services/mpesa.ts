// --- CONFIGURATION & TYPES ---
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'; // 'sandbox' or 'production'

const BASE_URL = MPESA_ENV === 'production' 
  ? "https://api.safaricom.co.ke" 
  : "https://sandbox.safaricom.co.ke";

// Helper to validate env vars immediately
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing Environment Variable: ${key}`);
  return value;
}

// Robust Phone Normalizer
function formatPhoneNumber(phone: string): string {
  // 1. Remove non-digits (spaces, dashes, +)
  let p = phone.replace(/\D/g, '');
  
  // 2. Normalize to 254 format
  if (p.startsWith('0')) {
    p = '254' + p.slice(1);
  } else if (p.startsWith('254')) {
    // Already correct
  } else {
    // Assume it's a raw number like 712345678, prepend 254
    p = '254' + p;
  }
  
  return p;
}

export async function getAccessToken() {
  const consumerKey = getEnvVar("MPESA_CONSUMER_KEY");
  const consumerSecret = getEnvVar("MPESA_CONSUMER_SECRET");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3500 }, // Cache token for ~58 mins (Tokens expire in 1hr)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`M-Pesa Auth Failed: ${error.errorMessage || res.statusText}`);
    }

    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error("M-Pesa Token Error:", error);
    throw new Error("Failed to authenticate with Payment Gateway");
  }
}

export async function initiateSTKPush(phoneNumber: string, amount: number, orderId: string) {
  try {
    const token = await getAccessToken();
    
    // Credentials
    const shortcode = getEnvVar("MPESA_SHORTCODE");
    const passkey = getEnvVar("MPESA_PASSKEY");
    const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL").replace(/\/$/, ""); // Remove trailing slash
    const callbackSecret = getEnvVar("MPESA_CALLBACK_SECRET"); // THE SECURITY KEY

    // Timestamp & Password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Payload
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", // Change to "CustomerBuyGoodsOnline" if using a Till Number
      Amount: Math.ceil(amount), // Must be integer
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      // SECURE CALLBACK URL:
      CallBackURL: `${appUrl}/api/mpesa/callback?secret=${callbackSecret}`,
      AccountReference: "NAIROBI_STREET", // Max 12 chars
      TransactionDesc: `Order ${orderId}`
    };

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // Safaricom sometimes returns 200 OK but with an errorMessage in the body
    if (!res.ok || data.errorMessage) {
      throw new Error(data.errorMessage || data.ResponseDescription || "STK Push Failed");
    }

    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      message: data.ResponseDescription
    };

  } catch (error: any) {
    console.error("STK Push Error:", error);
    // Throw a clean error message for the frontend
    throw new Error(error.message || "Payment initiation failed. Please try again.");
  }
}