'use client';

import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReceiptDownloader({ order }: { order: any }) {
  
  const handleDownload = () => {
    // Open a new window for the receipt
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return alert("Please allow popups to download receipt");

    const html = `
      <html>
        <head>
          <title>Receipt #${order.mpesa_receipt}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-weight: 900; text-transform: uppercase; font-size: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
            .total { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin-top: 20px; font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; }
            .btn { display: none; } /* Hide buttons when printing */
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">OP Fits</div>
            <div>${new Date(order.created_at).toLocaleString()}</div>
            <div>Receipt: ${order.mpesa_receipt}</div>
          </div>
          
          <div>
            ${order.order_items.map((item: any) => `
              <div class="row">
                <span>${item.quantity}x ${item.variant_name}</span>
                <span>${(item.price_at_purchase/100).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>

          <div class="row total">
            <span>TOTAL PAID</span>
            <span>KES ${(order.total_amount/100).toLocaleString()}</span>
          </div>

          <div class="footer">
            <p>Thank you for supporting local.<br/>Order ID: ${order.id.slice(0,8)}</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    receiptWindow.document.write(html);
    receiptWindow.document.close();
  };

  return (
    <button 
      onClick={handleDownload}
      className="w-full py-3 border border-border text-sm font-bold uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center gap-2 rounded-md"
    >
      <Download size={16} /> Download Official Receipt
    </button>
  );
}