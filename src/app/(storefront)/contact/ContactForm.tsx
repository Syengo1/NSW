'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate network request (Will wire this to Supabase or Resend next)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-secondary/20 border border-border rounded-xl text-center animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Transmission Received</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
          Your Message has reached our servers. Our Team will process the intel and respond shortly.
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors border-b border-foreground hover:border-primary pb-1"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-secondary/10 border border-border p-6 md:p-8 rounded-xl space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2 relative group">
          <label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors">
            Identification
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Monkey D. Luffy"
            className="w-full bg-transparent border-b-2 border-border py-3 text-base font-medium placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors rounded-none"
          />
        </div>

        <div className="space-y-2 relative group">
          <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors">
            Return Signal (Email)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="captain@strawhats.com"
            className="w-full bg-transparent border-b-2 border-border py-3 text-base font-medium placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors rounded-none"
          />
        </div>
      </div>

      <div className="space-y-2 relative group">
        <label htmlFor="subject" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors">
          Nature of Inquiry
        </label>
        <select
          id="subject"
          name="subject"
          required
          defaultValue=""
          className="w-full bg-transparent border-b-2 border-border py-3 text-base font-medium focus:outline-none focus:border-primary transition-colors rounded-none appearance-none cursor-pointer"
        >
          <option value="" disabled className="text-muted-foreground bg-background">Select a classification</option>
          <option value="order" className="bg-background">Order Tracking / Fulfillment</option>
          <option value="sizing" className="bg-background">Sizing & Dimensions</option>
          <option value="drop" className="bg-background">Future Drop Intel</option>
          <option value="collab" className="bg-background">Partnerships / B2B</option>
        </select>
      </div>

      <div className="space-y-2 relative group">
        <label htmlFor="message" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors">
          Encrypted Payload
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Enter your message here..."
          className="w-full bg-transparent border-b-2 border-border py-3 text-base font-medium placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors rounded-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full py-5 bg-foreground text-background font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.99]",
          isSubmitting && "opacity-70 cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Transmitting
          </>
        ) : (
          <>
            Send Message
            <Send size={18} />
          </>
        )}
      </button>
    </form>
  );
}