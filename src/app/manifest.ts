import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OP Fits Command Center',
    short_name: 'OP Fits',
    description: 'Premium Streetwear Store & Inventory Control',
    start_url: '/admin',
    display: 'standalone', // This hides the Safari/Chrome browser URL bar
    background_color: '#09090b', // Zinc-950 to match your dark mode
    theme_color: '#09090b',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}