// src/lib/services/notifications.ts

export interface TelegramDispatchPayload {
  orderNumber: string;
  amount: number;
  receiptNumber: string;
  
  // Customer Details
  customerName: string;
  customerPhone: string;
  
  // Recipient Details (If it's a gift)
  recipientName?: string | null;
  recipientPhone?: string | null;
  
  // Logistics
  deliveryMethod: string; // 'pickup' | 'delivery'
  location?: string | null;
  coordinates?: string | null;
  
  // Cart Items
  items: Array<{
    quantity: number;
    product_name: string;
    variant_name: string;
  }>;
}

export async function sendAdminTelegramAlert(orderData: TelegramDispatchPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.opfits.com';

  if (!token || !chatId) {
    console.warn("Telegram credentials missing. Skipping notification.");
    return;
  }

  // 1. Format Currency
  const formattedAmount = new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES' 
  }).format(orderData.amount / 100);

  // 2. Format Items List
  const itemsText = orderData.items && orderData.items.length > 0 
    ? orderData.items.map(i => `▪️ ${i.quantity}x <b>${i.product_name}</b>\n   <i>(${i.variant_name})</i>`).join('\n')
    : "<i>No items found in payload</i>";

  // 3. Format Logistics Block
  let logisticsText = "";
  if (orderData.deliveryMethod === 'pickup') {
    logisticsText = `🏬 <b>Method:</b> STORE PICKUP`;
  } else {
    const mapsLink = orderData.coordinates 
      ? `\n🗺️ <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.coordinates)}">Open GPS Route</a>` 
      : "";
    logisticsText = `🚚 <b>Method:</b> DELIVERY\n📍 <b>Address:</b> ${orderData.location || 'Not provided'}${mapsLink}`;
  }

  // 4. Format Recipient (If different from customer)
  const isGift = orderData.recipientPhone && orderData.recipientPhone !== orderData.customerPhone;
  const recipientText = isGift 
    ? `\n\n🎁 <b>RECIPIENT DETAILS</b>\n👤 <b>Name:</b> ${orderData.recipientName}\n📞 <b>Phone:</b> ${orderData.recipientPhone}`
    : "";

  // 5. Construct Final HTML Message
  // Telegram requires strict HTML. Using <b>, <i>, <a>
  const message = `
🚨 <b>PAYMENT SECURED!</b> 🚨

💰 <b>Amount:</b> ${formattedAmount}
🧾 <b>Receipt:</b> ${orderData.receiptNumber}
🔖 <b>Order:</b> #${orderData.orderNumber}

👤 <b>CUSTOMER</b>
<b>Name:</b> ${orderData.customerName}
<b>Phone:</b> ${orderData.customerPhone}${recipientText}

📦 <b>LOGISTICS</b>
${logisticsText}

🛒 <b>ORDER SUMMARY</b>
${itemsText}

🔗 <a href="${appUrl}/admin/orders?highlight=${orderData.orderNumber}">View in Command Center</a>
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true, 
      }),
    });

    if (!response.ok) {
      console.error("[Telegram Error] Failed to send alert:", await response.text());
    }
  } catch (error) {
    console.error("[Telegram Fatal] Connection error:", error);
  }
}