'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- LEGAL DATA STRUCTURE ---
// Your lawyer will only need to edit this array. 
// The UI will automatically build itself.
const TERMS_SECTIONS = [
  {
    id: 'general',
    title: '1. General & Acceptance',
    content: `Welcome to OPFITS / Nairobi Streetwear. By accessing our website, purchasing our products, or participating in our clothing drops, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services. We reserve the right to update these terms at any time without prior notice.`
  },
  {
    id: 'drops',
    title: '2. Product Drops & Availability',
    content: `Our streetwear is often released in limited-quantity "drops". Adding an item to your cart does not reserve the stock. An order is only confirmed once checkout is complete and payment is successfully processed. We reserve the right to cancel any order if our system detects bot activity, fraudulent transactions, or inventory discrepancies.`
  },
  {
    id: 'payments',
    title: '3. Payments & Billing',
    content: `All prices are listed in Kenyan Shillings (KES). We process payments primarily via M-Pesa (Till Number / STK Push) and authorized third-party gateways (e.g., IntaSend). By confirming your order, you authorize us to charge the provided mobile number or account. In the event of a network timeout or delayed M-Pesa receipt, your order status will remain "Pending" until funds are securely cleared on our end.`
  },
  {
    id: 'shipping',
    title: '4. Delivery & Logistics Liability',
    content: `We utilize a tiered delivery system, ranging from local riders (e.g., Boda Boda) for hyper-local Nairobi deliveries to nationwide couriers (e.g., G4S, Fargo Courier) for upcountry orders. While we ensure items are dispatched in pristine condition, we are not liable for delays caused by third-party logistics, adverse weather, or inaccurate delivery addresses provided by the customer. Risk of loss passes to you upon our delivery to the carrier.`
  },
  {
    id: 'returns',
    title: '5. Returns & Exchanges',
    content: `Due to the limited and exclusive nature of our drops, all sales are strictly final. We only accept returns or exchanges in the event of a gross manufacturing defect or if the wrong item was shipped. Such claims must be reported to our support team within 24 hours of package delivery, with tags fully attached and the item completely unworn.`
  },
  {
    id: 'ip',
    title: '6. Intellectual Property',
    content: `All designs, logos, graphics, garment patterns, and digital content (including product photography and custom UI elements) are the exclusive intellectual property of Antony Syengo and the OPFITS brand. Unauthorized reproduction, resale, or distribution of our physical goods or digital assets is strictly prohibited and subject to legal action under Kenyan copyright laws.`
  },
  {
    id: 'governing-law',
    title: '7. Governing Law',
    content: `These Terms and Conditions, and any separate agreements whereby we provide you services, shall be governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Nairobi, Kenya.`
  }
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string>(TERMS_SECTIONS[0].id);

  // Intersection Observer for smooth Scroll Spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' } 
    );

    TERMS_SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100; // Offset for fixed header
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative items-start">
      
      {/* SIDEBAR NAVIGATION (Sticky) */}
      <aside className="md:col-span-4 lg:col-span-3 md:sticky top-28 hidden md:block">
        <div className="bg-secondary/20 border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 text-muted-foreground uppercase tracking-widest text-xs font-bold">
            <Shield size={16} /> Table of Contents
          </div>
          <nav className="space-y-1">
            {TERMS_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full text-left flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className="truncate">{section.title}</span>
                {activeSection === section.id && <ChevronRight size={14} />}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="md:col-span-8 lg:col-span-9 space-y-16 pb-24">
        
        {/* Placeholder Disclaimer */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-start gap-3 text-orange-600 dark:text-orange-400">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold uppercase tracking-widest text-xs mb-1">Pending Legal Review</p>
            <p>This document is a structural placeholder. It must be reviewed by a certified legal professional in Kenya to ensure full compliance with the Consumer Protection Act before launching commercial operations.</p>
          </div>
        </div>

        {/* Dynamic Content Generation */}
        {TERMS_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 text-foreground border-b border-border pb-4">
              {section.title}
            </h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-sm md:text-base">
              {/* If you add HTML to your content array later, switch this to dangerouslySetInnerHTML */}
              <p className="whitespace-pre-line">{section.content}</p>
            </div>
          </section>
        ))}

        <div className="pt-12 border-t border-border/50 text-xs text-muted-foreground font-mono">
          Last Updated: {new Date().toLocaleDateString('en-KE')} | Document Version: 1.0.0-DRAFT
        </div>
      </div>
    </div>
  );
}