'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, X, Plus, Sparkles, Shirt, Save, Loader2, Tag, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { createProductDrop, type VariantInput } from '../actions';

export default function NewDropPage() {
  const router = useRouter(); 
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- STATE: IMAGES & COLORS ---
  const [uploading, setUploading] = useState(false);
  const [imageAssets, setImageAssets] = useState<{ url: string; color?: string }[]>([]);

  // --- STATE: PRICING ---
  const [basePrice, setBasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');

  // --- STATE: VARIANTS ---
  const [sizesInput, setSizesInput] = useState('S, M, L, XL');
  const [colorsInput, setColorsInput] = useState('Black, White');
  const [generatedVariants, setGeneratedVariants] = useState<VariantInput[]>([]);

  const discountPercentage = useMemo(() => {
    const base = parseFloat(basePrice);
    const sale = parseFloat(salePrice);
    if (!base || !sale || sale >= base) return null;
    return Math.round(((base - sale) / base) * 100);
  }, [basePrice, salePrice]);

  const activeColors = useMemo(() => {
    return Array.from(new Set(generatedVariants.map(v => v.color)));
  }, [generatedVariants]);

  // 1. IMAGE UPLOADER LOGIC
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, colorTag?: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `drop-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      
      setImageAssets(prev => [...prev, { url: data.publicUrl, color: colorTag }]);
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error("Upload failed: " + msg);
    } finally {
      setUploading(false);
    }
  };

  // 2. VARIANT GENERATOR
  const generateMatrix = () => {
    const sizes = sizesInput.split(',').map(s => s.trim()).filter(Boolean);
    const colors = colorsInput.split(',').map(c => c.trim()).filter(Boolean);
    
    if (sizes.length === 0 || colors.length === 0) {
      toast.error("Please enter at least one Size and one Color.");
      return;
    }

    const newVariants: VariantInput[] = [];
    colors.forEach(color => {
      sizes.forEach(size => {
        const colorCode = color.substring(0, 3).toUpperCase();
        const sizeCode = size.toUpperCase();
        const sku = `DROP-${colorCode}-${sizeCode}-${Math.floor(Math.random() * 1000)}`;
        newVariants.push({ size, color, sku, stock: 10, priceDiff: 0 });
      });
    });
    setGeneratedVariants(newVariants);
  };

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
      {/* HEADER */}
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
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* BASIC DETAILS */}
          <div className="bg-card border border-border p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
               <Sparkles size={18} className="text-muted-foreground" />
               <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Drop Concept</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Product Title</label>
                 <input name="title" required placeholder="e.g. CONCRETE JUNGLE HOODIE" className="w-full bg-secondary border border-border p-4 text-sm font-bold text-foreground uppercase focus:border-primary outline-none transition-all" />
               </div>
               
               {/* PRICING SECTION */}
               <div className="col-span-2 grid grid-cols-2 gap-6 bg-secondary/50 p-4 border border-border rounded relative overflow-hidden">
                 <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Base Price (KES)</label>
                   <input 
                      name="basePrice" 
                      type="number" 
                      required 
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="4500" 
                      className="w-full bg-background border border-border p-3 font-mono text-foreground focus:border-primary outline-none" 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                     <Tag size={12} /> Sale Price (Optional)
                   </label>
                   <input 
                      name="salePrice" 
                      type="number" 
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="3500" 
                      className="w-full bg-background border border-emerald-900/20 dark:border-emerald-900/50 p-3 font-mono text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 outline-none" 
                   />
                 </div>

                 {/* Percentage Badge */}
                 {discountPercentage && (
                   <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-black px-3 py-1 rounded-bl shadow-lg animate-in slide-in-from-right">
                     {discountPercentage}% OFF
                   </div>
                 )}
               </div>

               <div>
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Category</label>
                 <select name="category" className="w-full bg-secondary border border-border p-4 text-sm text-foreground uppercase outline-none focus:border-primary">
                  <option>Hoodies</option>
                  <option>T-Shirts</option>
                  <option>Footwear</option>
                  <option>Headwear</option>
                  <option>Accessories</option>
                </select>
               </div>
               <div>
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Gender</label>
                 <select name="gender" className="w-full bg-secondary border border-border p-4 text-sm text-foreground uppercase outline-none focus:border-primary">
                  <option value="unisex">Unisex</option>
                  <option value="men">Mens</option>
                  <option value="women">Womens</option>
                </select>
               </div>
               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Manifesto</label>
                 <textarea name="description" rows={4} className="w-full bg-secondary border border-border p-4 text-sm text-foreground outline-none focus:border-primary" placeholder="Describe the texture..." />
               </div>
            </div>
          </div>

          {/* VARIANT MATRIX */}
          <div className="bg-card border border-border p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
               <Shirt size={18} className="text-muted-foreground" />
               <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Inventory Matrix</h3>
            </div>
            
            {/* Input Generators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/30 p-6 border border-border border-dashed">
               <div><label className="text-xs font-bold uppercase text-muted-foreground block mb-2">Sizes</label><input value={sizesInput} onChange={e => setSizesInput(e.target.value)} className="w-full bg-background border border-border p-3 text-sm text-foreground outline-none focus:border-primary" /></div>
               <div><label className="text-xs font-bold uppercase text-muted-foreground block mb-2">Colors</label><input value={colorsInput} onChange={e => setColorsInput(e.target.value)} className="w-full bg-background border border-border p-3 text-sm text-foreground outline-none focus:border-primary" /></div>
               <div className="col-span-1 md:col-span-2">
                 <button type="button" onClick={generateMatrix} className="w-full bg-primary text-primary-foreground text-xs font-black uppercase py-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Sparkles size={14} /> Generate Stock Units
                 </button>
               </div>
            </div>

            {/* Table Output */}
            {generatedVariants.length > 0 && (
              <div className="border border-border overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary text-muted-foreground font-bold uppercase"><tr><th className="p-4">SKU</th><th className="p-4">Color</th><th className="p-4">Size</th><th className="p-4">Stock</th><th className="p-4 text-right">Action</th></tr></thead>
                  <tbody className="divide-y divide-border bg-card">
                    {generatedVariants.map((v, i) => (
                      <tr key={i} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-4 font-mono text-muted-foreground">{v.sku}</td>
                        <td className="p-4 font-bold text-foreground">{v.color}</td>
                        <td className="p-4 font-bold text-foreground">{v.size}</td>
                        <td className="p-4"><input type="number" value={v.stock} onChange={(e) => {const n = [...generatedVariants]; n[i].stock = parseInt(e.target.value); setGeneratedVariants(n)}} className="w-20 bg-background border border-border p-2 text-center text-foreground outline-none focus:border-primary" /></td>
                        <td className="p-4 text-right"><button type="button" onClick={() => setGeneratedVariants(generatedVariants.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: IMAGES */}
        <div className="space-y-8">
          <div className="bg-card border border-border p-6 space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-sm text-foreground border-b border-border pb-4">Visual Assets</h3>
            
            {/* General Gallery */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {imageAssets.filter(i => !i.color).map((asset, i) => (
                <div key={i} className="relative aspect-square bg-secondary group border border-border overflow-hidden">
                  <Image 
                    src={asset.url} 
                    alt="Product Asset" 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 768px) 100vw, 50vw" 
                  />
                  <button type="button" onClick={() => setImageAssets(imageAssets.filter(a => a !== asset))} className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12} /></button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                 {uploading ? <Loader2 className="animate-spin" /> : <Plus />}
                 <span className="text-[10px] font-bold uppercase mt-2">General Image</span>
                 <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e)} disabled={uploading} />
              </label>
            </div>

            {/* Smart Color Matchers */}
            {activeColors.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">Color Specific Assets</h4>
                {activeColors.map(color => {
                   const asset = imageAssets.find(a => a.color === color);
                   return (
                     <div key={color} className="flex items-center gap-4 bg-secondary/30 p-2 border border-border">
                        <div className="w-12 h-12 bg-background border border-border flex items-center justify-center overflow-hidden relative shrink-0">
                           {asset ? <Image src={asset.url} alt={`${color} variant`} fill className="object-cover" sizes="48px" /> : <ImageIcon size={16} className="text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold uppercase truncate">{color}</div>
                          <div className="text-[10px] text-muted-foreground">{asset ? 'Asset Linked' : 'No image linked'}</div>
                        </div>
                        <label className="cursor-pointer bg-primary text-primary-foreground text-[10px] font-bold uppercase px-3 py-1.5 hover:opacity-90 transition-opacity shrink-0">
                           {asset ? 'Change' : 'Upload'}
                           <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e, color)} disabled={uploading} />
                        </label>
                     </div>
                   )
                })}
              </div>
            )}
          </div>

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