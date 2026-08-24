'use client';

import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// --- STRICT TYPES ---
export interface ReceiptOrderItem {
  quantity: number;
  variant_name: string;
  price_at_purchase: number;
}

export interface ReceiptOrder {
  id: string;
  order_number: string;
  mpesa_receipt?: string;
  created_at: string;
  total_amount: number;
  customer_name?: string; 
  full_name?: string;     
  order_items: ReceiptOrderItem[];
}

interface ReceiptDownloaderProps {
  order: ReceiptOrder;
}

// 🚨 SECURITY FIX: HTML Escaper to prevent DOM-based XSS
const escapeHTML = (str: string) => {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
};

export default function ReceiptDownloader({ order }: ReceiptDownloaderProps) {
  
  const handleDownload = () => {
    const receiptWindow = window.open('', '_blank');
    
    if (!receiptWindow) {
      toast.error("Please allow popups to download your receipt.");
      return;
    }

    const rawName = order.full_name || order.customer_name || "Valued Customer";
    
    // 🚨 SECURITY FIX: Sanitize the name before injecting it into the DOM
    const sanitizedName = escapeHTML(rawName).toUpperCase();
    const firstName = sanitizedName.split(' ')[0];
    
    const logoUrl = `${window.location.origin}/icon.png`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt #${escapeHTML(order.mpesa_receipt || order.order_number)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
            
            body { 
              font-family: 'Space Mono', 'Courier New', monospace; 
              padding: 40px 20px; 
              max-width: 400px; 
              margin: 0 auto; 
              color: #000;
              background: #fff;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            
            /* 🚨 ALIGNMENT FIX: Forces the image to behave like a centered block element */
            .receipt-logo {
              width: 55px;
              height: 55px;
              object-fit: contain;
              filter: grayscale(100%);
              display: block;
              margin: 0 auto 12px auto; 
            }
            
            .title { 
              font-weight: 700; 
              text-transform: uppercase; 
              font-size: 24px; 
              letter-spacing: -1px; 
              margin-bottom: 4px; 
            }
            
            .subtitle { font-size: 12px; color: #666; }
            
            .customer-info {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 15px 0;
              margin-bottom: 25px;
              font-size: 13px;
              text-align: center;
              line-height: 1.5;
            }
            
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
            .item-name { max-width: 70%; line-height: 1.4; }
            
            .total { 
              border-top: 2px dashed #000; 
              padding: 15px 0 0; 
              margin-top: 25px; 
              font-weight: 700; 
              font-size: 16px; 
            }
            
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              font-size: 11px; 
              line-height: 1.6;
              color: #000; 
            }
            
            @media print { 
              body { padding: 0; }
              .no-print { display: none; } 
            }
          </style>
        </head>
        <body>
          
          <div class="header">
            <img src="${logoUrl}" alt="OP Fits Logo" class="receipt-logo" onload="window.print();" onerror="window.print();" />
            <div class="title">OP FITS</div>
            <div class="subtitle">${new Date(order.created_at).toLocaleString('en-KE')}</div>
            <div class="subtitle">Receipt: ${escapeHTML(order.mpesa_receipt || order.order_number)}</div>
          </div>

          <div class="customer-info">
            PREPARED FOR:<br/>
            <strong>${sanitizedName}</strong>
          </div>
          
          <div class="items">
            ${order.order_items.map(item => `
              <div class="row">
                <span class="item-name">${item.quantity}x ${escapeHTML(item.variant_name)}</span>
                <span>${(item.price_at_purchase / 100).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>

          <div class="row total">
            <span>TOTAL PAID</span>
            <span>KES ${(order.total_amount / 100).toLocaleString()}</span>
          </div>

          <div class="footer">
            <p>THANK YOU FOR SHOPPING AT OP FITS, ${firstName}.</p>
            <p>WEAR IT BOLD. SECURE THE NEXT DROP AT<br/><strong>OPFITS.COM</strong></p>
            <p style="margin-top: 20px; font-size: 10px; color: #888;">*${escapeHTML(order.order_number).toUpperCase()}*</p>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(html);
    receiptWindow.document.close();
  };

  return (
    <button 
      onClick={handleDownload}
      className="w-full py-4 bg-background border border-border shadow-sm text-xs md:text-sm font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-300 flex items-center justify-center gap-3 rounded-xl active:scale-[0.98]"
    >
      <Download size={18} /> Official Receipt
    </button>
  );
}