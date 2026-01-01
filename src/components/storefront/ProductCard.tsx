'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  status: 'active' | 'draft' | 'dropping_soon' | 'archived'; // Matches your DB enum
}

export default function ProductCard({ title, slug, price, image, category, status }: ProductCardProps) {
  // Logic to determine badges
  const isDroppingSoon = status === 'dropping_soon';

  return (
    <Link href={`/product/${slug}`} className="group block relative">
      {/* 1. IMAGE CONTAINER */}
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900 w-full">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 ease-out",
              "group-hover:scale-105 group-hover:grayscale-0",
              "grayscale" // Start grayscale for that "Street" look, color on hover
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-800 font-bold uppercase tracking-widest">
            No Image
          </div>
        )}

        {/* OVERLAYS */}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        
        {/* BADGES */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isDroppingSoon && (
            <span className="bg-accent text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
              Dropping Soon
            </span>
          )}
        </div>

        {/* HOVER ACTION */}
        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-black/90 to-transparent">
          <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            View Product <ArrowUpRight size={14} />
          </span>
        </div>
      </div>

      {/* 2. INFO */}
      <div className="mt-4 space-y-1">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm font-bold uppercase leading-tight text-white group-hover:text-neutral-400 transition-colors">
            {title}
          </h3>
          <span className="text-sm font-mono text-neutral-400">
            KES {(price / 100).toLocaleString()}
          </span>
        </div>
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
          {category}
        </p>
      </div>
    </Link>
  );
}