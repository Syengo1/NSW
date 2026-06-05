import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Fallback to localhost if the env var isn't set yet
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
        '/track-order/' // No need to index private order tracking pages
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}