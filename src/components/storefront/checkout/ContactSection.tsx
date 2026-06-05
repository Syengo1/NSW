// src/components/storefront/checkout/ContactSection.tsx
'use client';

import { User, Smartphone, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactSectionProps {
  phone: string;
  setPhone: (phone: string) => void;
  phoneError: boolean;
  separateRecipient: boolean;
  setSeparateRecipient: (show: boolean) => void;
}

export function ContactSection({
  phone,
  setPhone,
  phoneError,
  separateRecipient,
  setSeparateRecipient,
}: ContactSectionProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 shadow-sm border border-border rounded-xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-black dark:bg-white" />
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <User size={14} /> Contact Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Payer Name</label>
          <input name="payerName" required placeholder="JOMO KENYATTA" className="w-full bg-secondary border border-border p-3 text-sm font-bold uppercase focus:border-primary outline-none rounded-md" />
        </div>
        <div>
          <div className="flex justify-between">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">M-Pesa Number</label>
             {phoneError && <span className="text-[10px] text-red-500 font-bold animate-pulse">Invalid Format</span>}
          </div>
          <div className="relative group">
            <Smartphone className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", phoneError ? "text-red-500" : "text-muted-foreground group-focus-within:text-primary")} size={16} />
            <input 
              id="phone-input"
              name="payerPhone" 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required 
              placeholder="0712 345 678" 
              className={cn(
                 "w-full bg-secondary border p-3 pl-10 text-sm font-mono outline-none rounded-md transition-all",
                 phoneError ? "border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10" : "border-border focus:border-primary"
              )} 
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Prompt will be sent to this number.</p>
        </div>
      </div>

      <div className="pt-2">
         <label className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className={cn("w-5 h-5 border-2 rounded flex items-center justify-center transition-colors", separateRecipient ? "bg-black border-black dark:bg-white dark:border-white" : "border-muted-foreground")}>
               {separateRecipient && <CheckCircle2 size={14} className="text-white dark:text-black" />}
            </div>
            <input type="checkbox" className="hidden" checked={separateRecipient} onChange={(e) => setSeparateRecipient(e.target.checked)} />
            <span className="text-xs font-bold uppercase select-none group-hover:text-primary transition-colors">Gift / Someone else receiving</span>
         </label>
      </div>

      {separateRecipient && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-dashed border-border">
           <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Recipient Name</label><input name="recipientName" required placeholder="Recipient Name" className="w-full bg-secondary border border-border p-3 text-sm font-bold uppercase focus:border-primary outline-none rounded-md" /></div>
           <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Recipient Phone</label><input name="recipientPhone" type="tel" required placeholder="07XX XXX XXX" className="w-full bg-secondary border border-border p-3 text-sm font-mono focus:border-primary outline-none rounded-md" /></div>
        </div>
      )}
    </div>
  );
}