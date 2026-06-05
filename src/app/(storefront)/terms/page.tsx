import TermsPage from '@/components/storefront/legal/TermsPage';
import { Metadata } from 'next';

// Server-side SEO optimization
export const metadata: Metadata = {
  title: 'Terms & Conditions | OPFITS',
  description: 'The official terms, conditions, and store policies for Nairobi Streetwear.',
};

export default function TermsAndConditionsRoute() {
  return (
    <div className="min-h-screen bg-background pt-6 px-6">
      <div className="max-w-7xl mx-auto mb-16 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
          Terms & Conditions
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs md:text-sm max-w-2xl">
          Please read these terms carefully before participating in our drops.
        </p>
      </div>

      {/* Mount the interactive Client Component */}
      <TermsPage />
    </div>
  );
}