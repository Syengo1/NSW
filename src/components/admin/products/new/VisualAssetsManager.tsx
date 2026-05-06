'use client';
import { useState, useMemo } from 'react';
import { Loader2, Plus, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { VariantInput } from '@/app/(dashboard)/admin/products/actions';

interface VisualAssetsProps {
  imageAssets: { url: string; color?: string }[];
  setImageAssets: React.Dispatch<React.SetStateAction<{ url: string; color?: string }[]>>;
  generatedVariants: VariantInput[];
}

export default function VisualAssetsManager({ imageAssets, setImageAssets, generatedVariants }: VisualAssetsProps) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const activeColors = useMemo(() => {
    return Array.from(new Set(generatedVariants.map(v => v.color)));
  }, [generatedVariants]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, colorTag?: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `drop-images/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setImageAssets(prev => [...prev, { url: data.publicUrl, color: colorTag }]);
      
    } catch (err: unknown) {
      toast.error("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border p-6 space-y-4">
      <h3 className="font-bold uppercase tracking-wider text-sm text-foreground border-b border-border pb-4">Visual Assets</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {imageAssets.filter(i => !i.color).map((asset, i) => (
          <div key={i} className="relative aspect-square bg-secondary group border border-border overflow-hidden">
            <Image src={asset.url} alt="Product Asset" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <button type="button" onClick={() => setImageAssets(imageAssets.filter(a => a !== asset))} className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12} /></button>
          </div>
        ))}
        <label className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
           {uploading ? <Loader2 className="animate-spin" /> : <Plus />}
           <span className="text-[10px] font-bold uppercase mt-2">General Image</span>
           <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e)} disabled={uploading} />
        </label>
      </div>

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
  );
}