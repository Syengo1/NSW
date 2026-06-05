import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Mail, Phone, Clock, ArrowUpRight, Hexagon, ArrowLeft } from 'lucide-react';
import { ContactForm } from './ContactForm';
import Footer from "@/components/storefront/Footer";

export const metadata: Metadata = {
  title: 'Comms | Nairobi Streetwear',
  description: 'Secure transmission channel for inquiries, sizing, and drop intel.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="max-w-6xl mx-auto space-y-10 md:space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* BACK BUTTON */}
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Return to Storefront
        </Link>

        {/* HEADER */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 text-primary">
            <Hexagon className="fill-primary/20" size={24} />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.3em]">Comms Link Established</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            Transmission
          </h1>
          <p className="text-muted-foreground text-sm md:text-base tracking-wider max-w-xl leading-relaxed">
            Whether you are hunting down a specific drop, inquiring about sizing, or looking to collaborate. Drop your query below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* LEFT COLUMN: COORDINATES */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-8">
              
              {/* WhatsApp / Phone */}
              <div className="group">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                  <Phone size={12} /> Hit Us Up
                </h3>
                <a 
                  href="https://wa.me/254114513647" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xl font-mono font-bold hover:text-primary transition-colors flex items-center gap-3"
                >
                  +254 114 513 647
                  <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 group-hover:-translate-y-1" />
                </a>
              </div>

              {/* Email */}
              <div className="group">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                  <Mail size={12} /> Digital Dispatch
                </h3>
                <a 
                  href="mailto:syengowork@gmail.com" 
                  className="text-xl font-bold hover:text-primary transition-colors flex items-center gap-3"
                >
                  syengowork@gmail.com
                  <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 group-hover:-translate-y-1" />
                </a>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                  <MapPin size={12} /> Base of Operations
                </h3>
                <address className="not-italic text-base font-medium space-y-1 text-foreground/90">
                  <p>Ngong, Kenya</p>
                  <p className="text-muted-foreground text-sm">Nation-Wide Shipping Available</p>
                </address>
              </div>

              {/* Hours */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                  <Clock size={12} /> Active Hours 
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground uppercase">Mon - Fri</span>
                    <span className="font-bold">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground uppercase">Saturday</span>
                    <span className="font-bold">10:00 - 15:00</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-muted-foreground uppercase">Sunday</span>
                    <span className="font-bold text-primary">Offline</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE FORM */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>
        <Footer />
    </div>
  );
}