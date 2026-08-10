'use client';

import { useState, useMemo } from 'react';
import { Loader2, Plus, X, Image as ImageIcon, GripVertical, Star, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { VariantInput } from '@/app/(dashboard)/admin/products/actions';
import { cn } from '@/lib/utils'; 

export interface ImageAsset {
  url: string;
  color: string;
  id?: string;
}

interface VisualAssetsProps {
  imageAssets: ImageAsset[];
  setImageAssets: React.Dispatch<React.SetStateAction<ImageAsset[]>>;
  generatedVariants: VariantInput[];
}

export default function VisualAssetsManager({ imageAssets, setImageAssets, generatedVariants }: VisualAssetsProps) {
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  
  // --- ADVANCED DRAG & DROP STATE ---
  const [draggedColor, setDraggedColor] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverColor, setDragOverColor] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const supabase = createClient();

  // Extract unique active colors from generated matrix, defaulting to 'Default' if none generated yet
  const activeColors = useMemo(() => {
    const colors = Array.from(new Set(generatedVariants.map(v => v.color)));
    return colors.length > 0 ? colors : ['Default / All Colors'];
  }, [generatedVariants]);

  // Bulk Multi-Image Upload per Color
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, colorTag: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingColor(colorTag);
    const uploadedAssets: ImageAsset[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `drop-images/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        uploadedAssets.push({ url: data.publicUrl, color: colorTag, id: fileName });
      }

      setImageAssets(prev => [...prev, ...uploadedAssets]);
      toast.success(`Uploaded ${uploadedAssets.length} image(s) for ${colorTag}`);
    } catch (err: unknown) {
      toast.error("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploadingColor(null);
    }
  };

  const removeImage = (urlToRemove: string) => {
    setImageAssets(prev => prev.filter(a => a.url !== urlToRemove));
  };

  // --- CROSS-POLLINATION DRAG AND DROP ENGINE ---
  const handleDragStart = (e: React.DragEvent, index: number, color: string) => {
    setDraggedIndex(index);
    setDraggedColor(color);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number, color: string) => {
    e.preventDefault(); 
    // Ignore if hovering over the exact item being dragged
    if (draggedColor === color && draggedIndex === index) return;
    
    setDragOverColor(color);
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDragOverColor(null);
  };

  const handleDrop = (e: React.DragEvent, targetColor: string, targetIndexInColorGroup: number) => {
    e.preventDefault();
    
    // Safety check
    if (draggedIndex === null || draggedColor === null) {
      resetDragState();
      return;
    }

    // Ignore drops in the exact same spot
    if (draggedColor === targetColor && draggedIndex === targetIndexInColorGroup) {
      resetDragState();
      return;
    }

    const sourceImages = imageAssets.filter(a => a.color === draggedColor);
    const targetImages = draggedColor === targetColor ? sourceImages : imageAssets.filter(a => a.color === targetColor);
    const movedItem = sourceImages[draggedIndex];
    
    if (!movedItem) return;

    if (draggedColor === targetColor) {
      // 1. REORDER WITHIN THE SAME COLOR GROUP
      const updatedImages = [...sourceImages];
      updatedImages.splice(draggedIndex, 1);
      updatedImages.splice(targetIndexInColorGroup, 0, movedItem);

      setImageAssets(prev => [
        ...prev.filter(a => a.color !== targetColor),
        ...updatedImages
      ]);
    } else {
      // 2. CROSS-POLLINATION: MOVING TO A DIFFERENT COLOR GROUP
      // Mutate the item's color property to match its new home
      const newMovedItem = { ...movedItem, color: targetColor };
      
      const updatedSourceImages = [...sourceImages];
      updatedSourceImages.splice(draggedIndex, 1);
      
      const updatedTargetImages = [...targetImages];
      updatedTargetImages.splice(targetIndexInColorGroup, 0, newMovedItem);

      setImageAssets(prev => [
        ...prev.filter(a => a.color !== draggedColor && a.color !== targetColor),
        ...updatedSourceImages,
        ...updatedTargetImages
      ]);
    }

    resetDragState();
  };

  const resetDragState = () => {
    setDraggedIndex(null);
    setDraggedColor(null);
    setDragOverIndex(null);
    setDragOverColor(null);
  };

  return (
    <div className="sticky top-6 self-start bg-card border border-border rounded-xl p-5 space-y-6 shadow-sm max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-xs text-foreground flex items-center gap-2">
            <ImageIcon size={16} className="text-primary" /> Visual Assets & Angle Shots
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Drag thumbnails to reorder or move between colorways.</p>
        </div>
        <span className="text-[10px] font-mono bg-secondary px-2 py-1 rounded text-muted-foreground font-bold">
          {imageAssets.length} Total
        </span>
      </div>

      <div className="space-y-6">
        {activeColors.map(color => {
          const colorImages = imageAssets.filter(a => a.color === color);
          const isUploading = uploadingColor === color;

          return (
            <div 
              key={color} 
              className={cn(
                "space-y-3 p-3.5 border rounded-lg transition-colors duration-300",
                dragOverColor === color ? "bg-primary/5 border-primary/40" : "bg-secondary/10 border-border/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">{color}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({colorImages.length} angles)</span>
                </div>
                
                <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-foreground text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-md border border-border transition-all flex items-center gap-1.5 active:scale-95">
                  {isUploading ? <Loader2 size={12} className="animate-spin text-primary" /> : <UploadCloud size={12} />}
                  <span>{isUploading ? 'Uploading...' : 'Add Angles'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={e => handleBatchImageUpload(e, color)}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Gallery Grid for this Color */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {colorImages.map((asset, index) => {
                  const isDraggingThis = draggedColor === color && draggedIndex === index;
                  const isDragOverThis = dragOverColor === color && dragOverIndex === index;

                  return (
                    <div
                      key={asset.url}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, color)}
                      onDragOver={(e) => handleDragOver(e, index, color)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, color, index)}
                      onDragEnd={resetDragState}
                      className={cn(
                        "group relative aspect-square bg-background border rounded-md overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 shadow-xs",
                        isDraggingThis ? "opacity-30 border-dashed border-primary scale-95" : "border-border hover:border-primary",
                        isDragOverThis && !isDraggingThis ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : ""
                      )}
                    >
                      <Image
                        src={asset.url}
                        alt={`${color} view ${index + 1}`}
                        fill
                        className="object-cover pointer-events-none"
                        sizes="120px"
                      />

                      {/* Reorder Grip Handle Overlay */}
                      <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={10} />
                      </div>

                      {/* Primary Badge */}
                      {index === 0 && !isDraggingThis && (
                        <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground px-1 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-0.5 shadow-sm">
                          <Star size={8} className="fill-current" /> Cover
                        </div>
                      )}

                      {/* Delete Image Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(asset.url);
                        }}
                        className="absolute top-1 right-1 bg-destructive/90 hover:bg-destructive text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label="Remove image"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}

                {/* Universal Dropzone Placeholder */}
                {/* Accepts images dropped at the very end of the list, or in empty color groups */}
                <label 
                  onDragOver={(e) => handleDragOver(e, colorImages.length, color)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, color, colorImages.length)}
                  className={cn(
                    "aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-all",
                    dragOverColor === color && dragOverIndex === colorImages.length 
                      ? "border-primary bg-primary/10 text-primary scale-105" 
                      : "border-border/80 hover:bg-secondary/40 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isUploading ? (
                    <Loader2 size={16} className="animate-spin text-primary" />
                  ) : (
                    <>
                      <Plus size={16} />
                      <span className="text-[8px] font-black uppercase mt-1">Bulk Add</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={e => handleBatchImageUpload(e, color)}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}