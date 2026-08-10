'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Actions & Types
import { upsertProductDrop, getProductForEdit, type VariantInput } from '../actions';

// Extracted Modular Components
import BasicDetailsForm from '@/components/admin/products/new/BasicDetailsForm';
import VariantMatrixBuilder from '@/components/admin/products/new/VariantMatrixBuilder';
import VisualAssetsManager, { type ImageAsset } from '@/components/admin/products/new/VisualAssetsManager';

// --- CORE FORM COMPONENT ---
function DropFormOrchestrator() {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const formRef = useRef<HTMLFormElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [error, setError] = useState<string | null>(null);
  
  // Data Payload for Uncontrolled Inputs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [productData, setProductData] = useState<any>(null); 

  // Global Orchestration State
  const [basePrice, setBasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>(''); 
  const [category, setCategory] = useState<string>('Hoodies/Sweatshirts');
  
  const [generatedVariants, setGeneratedVariants] = useState<VariantInput[]>([]);
  // CRITICAL FIX: State is now strictly typed to match VisualAssetsManager expectations
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([]);

  // 1. DATA HYDRATION LOGIC (For Edit Mode)
  useEffect(() => {
    if (!editId) return;

    const loadProduct = async () => {
      try {
        const data = await getProductForEdit(editId);
        setProductData(data);

        // Populate Controlled React States
        setBasePrice((data.base_price / 100).toString());
        setSalePrice(data.sale_price ? (data.sale_price / 100).toString() : '');
        setCostPrice((data.cost_price / 100).toString());
        setCategory(data.category);

        // Hydrate Variant Matrix
        if (data.variants && data.variants.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setGeneratedVariants(data.variants.map((v: any) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            sku: v.sku,
            stock: v.stock_quantity,
            priceDiff: v.price_adjustment
          })));
        }

        // Hydrate Visual Assets
        if (data.product_images && data.product_images.length > 0) {
          setImageAssets(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.product_images.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => ({
              url: img.url,
              color: img.color_tag || 'Default / All Colors',
              id: img.id
            }))
          );
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load product data.";
        toast.error(msg);
        router.push('/admin/products');
      } finally {
        setFetching(false);
      }
    };

    loadProduct();
  }, [editId, router]);

  // 2. UNCONTROLLED DOM HYDRATION
  useEffect(() => {
    if (!fetching && productData && formRef.current) {
      const titleInput = formRef.current.elements.namedItem('title') as HTMLInputElement;
      const descInput = formRef.current.elements.namedItem('description') as HTMLTextAreaElement;
      const genderInput = formRef.current.elements.namedItem('gender') as HTMLSelectElement;

      if (titleInput) titleInput.value = productData.title;
      if (descInput) descInput.value = productData.description || '';
      if (genderInput) genderInput.value = productData.gender || 'unisex';
    }
  }, [fetching, productData]);

  // 3. ORCHESTRATOR SUBMIT
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      await upsertProductDrop(editId, formData, generatedVariants, imageAssets);
      toast.success(editId ? "Product drop updated successfully!" : "Product drop created successfully!");
      router.push('/admin/products'); 
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground animate-in fade-in duration-500">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Decrypting Product Matrix...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in zoom-in-95 duration-500 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-3 bg-secondary hover:bg-muted rounded-full transition-colors border border-border">
              <ArrowLeft size={20} />
          </Link>
          <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                {editId ? 'Edit Product Drop' : 'Architect New Drop'}
              </h1>
              <p className="text-muted-foreground text-xs uppercase tracking-widest">
                {editId ? 'Modify existing inventory and assets' : 'Create a new product release'}
              </p>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Data Entry */}
        <div className="lg:col-span-2 space-y-8">
          <BasicDetailsForm 
             basePrice={basePrice} setBasePrice={setBasePrice}
             salePrice={salePrice} setSalePrice={setSalePrice}
             costPrice={costPrice} setCostPrice={setCostPrice}
             category={category} setCategory={setCategory}
          />
          <VariantMatrixBuilder 
             category={category}
             generatedVariants={generatedVariants}
             setGeneratedVariants={setGeneratedVariants}
          />
        </div>

        {/* RIGHT COLUMN: Assets & Actions */}
        {/* CRITICAL LAYOUT FIX: Wrapped both child components in a unified sticky scroll container.
            Tailwind arbitrary variants neutralize the child's internal sticky properties so they scroll in harmony. */}
        <div className="lg:sticky lg:top-6 self-start flex flex-col gap-6 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar pb-6 pr-2 [&>div:first-child]:!static [&>div:first-child]:!max-h-none [&>div:first-child]:!overflow-visible">
          
          <VisualAssetsManager 
             imageAssets={imageAssets}
             setImageAssets={setImageAssets}
             generatedVariants={generatedVariants}
          />

          {/* Action Center */}
          <div className="bg-card border border-border p-6 space-y-4 shadow-xl shadow-black/5 rounded-xl shrink-0 mt-auto border-t-4 border-t-primary">
             <div className="flex justify-between items-center text-xs font-bold uppercase border-b border-border pb-4">
                <span className="text-muted-foreground">Action</span>
                <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                  ● {editId ? 'System Live' : 'Ready to Drop'}
                </span>
             </div>
             
             {error && (
               <div className="bg-destructive/10 text-destructive p-4 text-xs font-mono border border-destructive/20 rounded-md">
                 {error}
               </div>
             )}
             
             <button 
               type="submit" 
               disabled={loading || generatedVariants.length === 0} 
               className="group w-full bg-primary text-primary-foreground font-black uppercase py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-md"
             >
               {loading ? (
                 <Loader2 className="animate-spin" size={18} />
               ) : editId ? (
                 <RefreshCcw size={18} />
               ) : (
                 <Sparkles size={18} />
               )} 
               {loading ? 'Processing...' : editId ? 'Save Changes' : 'Launch Drop'}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// --- SUSPENSE BOUNDARY ---
export default function NewDropPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    }>
      <DropFormOrchestrator />
    </Suspense>
  );
}