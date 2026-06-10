import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // 🚨 ROBUSTNESS FIX: Use the actual live domain as the fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.opfits.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 🚫 Block crawlers from sensitive and non-SEO routes
      disallow: [
        '/admin/', 
        '/login/', 
        '/api/', 
        '/checkout/',
        '/track-order/',
        // 🚨 SEO FIX: Crawl Budget Optimization
        // Prevents Googlebot from getting trapped in infinite URL parameter loops
        // (e.g., /shop?sort=price_asc, /shop?filter=men) which dilutes your SEO ranking.
        '/*?*' 
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl, // Explicitly declare the host for strict Search Console alignment
  };
}