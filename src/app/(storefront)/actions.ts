'use server';

import { createClient } from '@/lib/supabase/server';

export interface QuickAddVariant {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
}

// Custom sort mapping for standard apparel sizes
const SIZE_ORDER: Record<string, number> = {
  'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'XXL': 7, '2XL': 7, '3XL': 8, 'OS': 9, 'ONE SIZE': 9
};

export async function fetchAllProductVariants(productId: string): Promise<QuickAddVariant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('variants')
    .select('id, size, color, stock_quantity, price_adjustment')
    .eq('product_id', productId)
    .eq('is_active', true);

  if (error || !data) {
    console.error("Failed to fetch variants for Quick Add:", error?.message);
    return [];
  }

  // --- SMART CATEGORICAL SORTING ---
  // Sorts sizes logically (S -> M -> L) instead of alphabetically, and puts numeric sizes in order
  const sortedVariants = data.sort((a, b) => {
    // 1. Sort by Color first to group them
    if (a.color !== b.color) return a.color.localeCompare(b.color);

    // 2. Sort by Size logically
    const sizeA = a.size.toUpperCase();
    const sizeB = b.size.toUpperCase();

    // Check if both are standard text sizes (S, M, L)
    const orderA = SIZE_ORDER[sizeA];
    const orderB = SIZE_ORDER[sizeB];

    if (orderA && orderB) return orderA - orderB;

    // Check if both are numeric sizes (e.g., shoes 40, 41, 42 or pants 32, 34)
    const numA = parseFloat(sizeA);
    const numB = parseFloat(sizeB);

    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

    // Fallback to basic alphabetical
    return sizeA.localeCompare(sizeB);
  });

  return sortedVariants as QuickAddVariant[];
}