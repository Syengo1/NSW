'use client';

import Link from 'next/link';
import { Github, Instagram, Twitter, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 pt-20 pb-32 md:pb-20 border-t border-white/10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* BRAND */}
        <div className="space-y-4">
          <h2 className="text-white text-2xl font-black uppercase tracking-tighter">opfits.</h2>
          <p className="text-xs leading-relaxed max-w-xs">
            Nairobi&apos;s premier plug for exclusive streetwear, hyped sneakers, and premium apparel.<br/>
            Hand-picked fits, 100% authentic, delivered fast.
          </p>
        </div>

        {/* LINKS */}
        <div className="space-y-4">
           <h3 className="text-white text-xs font-bold uppercase tracking-widest">Explore</h3>
           <ul className="space-y-2 text-xs">
              <li><Link href="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
              <li><Link href="/shop?category=Hoodies" className="hover:text-white transition-colors">Hoodies</Link></li>
              <li><Link href="/shop?category=Tees" className="hover:text-white transition-colors">Tees</Link></li>
           </ul>
        </div>

        <div className="space-y-4">
           <h3 className="text-white text-xs font-bold uppercase tracking-widest">Support</h3>
           <ul className="space-y-2 text-xs">
              <li><Link href="/track-order" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
           </ul>
        </div>

        {/* SOCIALS */}
        <div className="space-y-4">
           <h3 className="text-white text-xs font-bold uppercase tracking-widest">Connect</h3>
           <div className="flex gap-4">
              <Instagram size={20} className="hover:text-white transition-colors cursor-pointer" />
              <Twitter size={20} className="hover:text-white transition-colors cursor-pointer" />
              <Github size={20} className="hover:text-white transition-colors cursor-pointer" />
           </div>
        </div>
      </div>

      {/* DESIGNER TAG (Secret Animation) */}
      <div className="container mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} OPFits. All rights reserved.</p>
        
        <a 
          href="#" 
          target="_blank" 
          className="group flex items-center gap-2 hover:text-white transition-colors relative"
        >
          <span>Designed & Built by</span>
          <span className="font-bold text-white relative">
             KATE
             {/* Secret Underline Animation */}
             <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-500" />
          </span>
          <Heart size={10} className="group-hover:text-red-500 group-hover:animate-ping transition-colors" />
        </a>
      </div>
    </footer>
  );
}