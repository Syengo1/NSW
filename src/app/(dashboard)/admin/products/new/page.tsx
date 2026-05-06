'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Actions & Types
import { createProductDrop, type VariantInput } from '../actions';

// Extracted Modular Components
import BasicDetailsForm from '@/components/admin/products/new/BasicDetailsForm';
import VariantMatrixBuilder from '@/components/admin/products/new/VariantMatrixBuilder';
import VisualAssetsManager from '@/components/admin/products/new/VisualAssetsManager';

export default function NewDropPage() {
  const router = useRouter(); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global Orchestration State
  const [basePrice, setBasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [category, setCategory] = useState<string>('Hoodies');
  
  const [generatedVariants, setGeneratedVariants] = useState<VariantInput[]>([]);
  const [imageAssets, setImageAssets] = useState<{ url: string; color?: string }[]>([]);

  // Orchestrator Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createProductDrop(formData, generatedVariants, imageAssets);
      toast.success("Product drop created successfully!");
      router.push('/admin/products'); 
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-3 bg-secondary hover:bg-muted rounded-full transition-colors border border-border">
              <ArrowLeft size={20} />
          </Link>
          <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Architect New Drop</h1>
              <p className="text-muted-foreground text-xs uppercase tracking-widest">Create a new product release</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Data Entry */}
        <div className="lg:col-span-2 space-y-8">
          <BasicDetailsForm 
             basePrice={basePrice} setBasePrice={setBasePrice}
             salePrice={salePrice} setSalePrice={setSalePrice}
             category={category} setCategory={setCategory}
          />
          <VariantMatrixBuilder 
             category={category}
             generatedVariants={generatedVariants}
             setGeneratedVariants={setGeneratedVariants}
          />
        </div>

        {/* RIGHT COLUMN: Assets & Actions */}
        <div className="space-y-8">
          <VisualAssetsManager 
             imageAssets={imageAssets}
             setImageAssets={setImageAssets}
             generatedVariants={generatedVariants}
          />

          {/* Action Center */}
          <div className="bg-card border border-border p-6 space-y-4 sticky top-6 shadow-xl shadow-black/5">
             <div className="flex justify-between items-center text-xs font-bold uppercase border-b border-border pb-4">
                <span className="text-muted-foreground">Action</span>
                <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">● Ready to Drop</span>
             </div>
             {error && <div className="bg-destructive/10 text-destructive p-4 text-xs font-mono border border-destructive/20">{error}</div>}
             
             <button type="submit" disabled={loading || generatedVariants.length === 0} className="group w-full bg-primary text-primary-foreground font-black uppercase py-4 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} {loading ? 'Processing...' : 'Launch Drop'}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}