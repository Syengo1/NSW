import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// 🚨 PERFORMANCE FIX 1: Edge Caching
// Forces Vercel to cache this XML file on the Edge Network for 24 hours (86400 seconds).
// Googlebot gets an instant response, and you save thousands of unnecessary database reads.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 🚨 ROBUSTNESS FIX: Hardcode the production domain as the fallback, not localhost.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.opfits.com';

  // 1. Define your core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // Highest priority (Homepage)
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore`, // Added the new Explore page we built
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 🚨 ROBUSTNESS FIX: Prevent CI/CD Build Crashes
  // If env vars are missing during a Vercel build step, this gracefully degrades 
  // instead of throwing an undefined error and crashing your deployment.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseRoleKey) {
    console.warn("Supabase credentials missing. Generating static sitemap only.");
    return staticRoutes;
  }

  try {
    // 2. Fetch live products from Supabase
    const supabase = createClient(supabaseUrl, supabaseRoleKey);

    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'active'); // Removed is_visible assuming status='active' is the single source of truth

    if (error) throw error;

    // 3. Map products to sitemap entries
    const dynamicRoutes: MetadataRoute.Sitemap = (products || []).map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      // Failsafe in case a product is missing an updated_at timestamp
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7, // Products are slightly lower priority than main hub pages
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("Failed to generate dynamic sitemap:", error);
    return staticRoutes; 
  }
}