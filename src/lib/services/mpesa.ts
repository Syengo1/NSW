export async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  if (!consumerKey || !consumerSecret) throw new Error("Missing M-Pesa Creds");

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: `Basic ${auth}` },
    next: { revalidate: 3500 }, // Cache token for ~1 hour
  });

  const data = await res.json();
  return data.access_token;
}

export async function initiateSTKPush(phoneNumber: string, amount: number, orderId: string) {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  // Format phone (Ensure 254...)
  const formattedPhone = phoneNumber.startsWith("0") 
    ? "254" + phoneNumber.slice(1) 
    : phoneNumber;

  const res = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount), // Ensure integer
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
      AccountReference: "NAIROBI_STREET",
      TransactionDesc: `Order ${orderId}`,
    }),
  });

  const data = await res.json();
  
  if (data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || "M-Pesa refused the request");
  }

  return { checkoutRequestId: data.CheckoutRequestID };
}