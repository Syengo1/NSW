import { Home, Compass, Shirt } from 'lucide-react';

export const NAV_LINKS = [
  { href: '/explore', label: 'Explore', icon: Compass }, 
  { href: '/', label: 'Home', icon: Home },
  { href: '/shop', label: 'Shop', icon: Shirt },
];

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  base_price: number; // Fixed from 'price' to match your Supabase DB exactly
  sale_price: number | null;
  description: string;
  product_images: { url: string }[];
}