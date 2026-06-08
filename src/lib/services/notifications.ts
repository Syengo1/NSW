// src/lib/services/notifications.ts

export async function sendAdminTelegramAlert(orderData: {
  orderNumber: string;
  customerName: string;
  phone: string;
  amount: number;
  receiptNumber: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.opfits.com';

  if (!token || !chatId) {
    console.warn("Telegram credentials missing. Skipping notification.");
    return;
  }

  // Format the amount as currency
  const formattedAmount = new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES' 
  }).format(orderData.amount / 100);

  // HTML Formatted Message for a clean look
  const message = `
🚨 <b>PAYMENT SECURED!</b> 🚨

<b>Order:</b> ${orderData.orderNumber}
<b>Amount:</b> ${formattedAmount}
<b>Receipt:</b> ${orderData.receiptNumber}

<b>Customer:</b> ${orderData.customerName}
<b>Phone:</b> ${orderData.phone}

<a href="${appUrl}/admin/orders">View in Command Center</a>
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true, // Prevents giant link previews taking up screen space
      }),
    });

    if (!response.ok) {
      console.error("[Telegram Error] Failed to send alert:", await response.text());
    }
  } catch (error) {
    console.error("[Telegram Fatal] Connection error:", error);
  }
}