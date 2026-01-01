import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", { // Changed to Kenyan Shilling based on context
    style: "currency",
    currency: "KES",
  }).format(amount);
}