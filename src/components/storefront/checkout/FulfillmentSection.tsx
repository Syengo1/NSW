// src/components/storefront/checkout/FulfillmentSection.tsx
'use client';

import { Truck, Store, Map, Crosshair, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import AddressAutocomplete from '@/components/storefront/AddressAutocomplete';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface FulfillmentSectionProps {
  deliveryMethod: 'delivery' | 'pickup';
  setDeliveryMethod: (method: 'delivery' | 'pickup') => void;
  addressText: string;
  setAddressText: (text: string) => void;
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number } | null) => void;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  isLoaded: boolean;
  isLocating: boolean;
  distanceKm: number;
  deliveryFee: number;
  shopLat: number;
  shopLng: number;
  handleMapClick: (e: google.maps.MapMouseEvent) => void;
  handleMarkerDragEnd: (e: google.maps.MapMouseEvent) => void;
  handleLiveLocation: () => void;
}

export function FulfillmentSection({
  deliveryMethod,
  setDeliveryMethod,
  addressText,
  setAddressText,
  coords,
  setCoords,
  showMap,
  setShowMap,
  isLoaded,
  isLocating,
  distanceKm,
  deliveryFee,
  shopLat,
  shopLng,
  handleMapClick,
  handleMarkerDragEnd,
  handleLiveLocation,
}: FulfillmentSectionProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 shadow-sm border border-border rounded-xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-black dark:bg-white" />
      
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Truck size={14} /> Fulfillment Method
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setDeliveryMethod('delivery')}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-lg transition-all relative overflow-hidden group",
            deliveryMethod === 'delivery' 
              ? "border-black dark:border-white bg-neutral-100 dark:bg-zinc-800" 
              : "border-transparent bg-neutral-50 dark:bg-zinc-900 hover:bg-neutral-100"
          )}
        >
          <div className={cn("p-3 rounded-full transition-colors", deliveryMethod === 'delivery' ? "bg-black text-white dark:bg-white dark:text-black" : "bg-neutral-200 dark:bg-zinc-800")}>
             <Truck size={20} />
          </div>
          <span className="text-xs font-black uppercase tracking-wide">Delivery</span>
        </button>
        
        <button
          type="button"
          onClick={() => setDeliveryMethod('pickup')}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-lg transition-all relative overflow-hidden group",
            deliveryMethod === 'pickup' 
              ? "border-black dark:border-white bg-neutral-100 dark:bg-zinc-800" 
              : "border-transparent bg-neutral-50 dark:bg-zinc-900 hover:bg-neutral-100"
          )}
        >
          <div className={cn("p-3 rounded-full transition-colors", deliveryMethod === 'pickup' ? "bg-black text-white dark:bg-white dark:text-black" : "bg-neutral-200 dark:bg-zinc-800")}>
             <Store size={20} />
          </div>
          <span className="text-xs font-black uppercase tracking-wide">Store Pickup</span>
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
        {deliveryMethod === 'pickup' ? (
          <div className="flex gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg">
            <Store size={20} className="shrink-0 mt-1" />
            <div>
              <p className="font-bold uppercase text-sm">OP FITS, Ngong</p>
              <p className="text-xs opacity-80 mt-1">Ready for pickup within 2 hours.</p>
              <p className="text-[10px] font-mono mt-2 bg-white/50 dark:bg-black/20 w-fit px-2 py-0.5 rounded">Open Mon-Sat, 10am - 8pm</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Delivery Location</label>
                {coords && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Address Confirmed</span>}
              </div>
               
              <AddressAutocomplete 
                selectedAddress={addressText}
                onLocationSelect={(address, newCoords) => {
                  setAddressText(address);
                  setCoords(newCoords);
                  setShowMap(true);
                }}
                onAddressEdit={(text) => setAddressText(text)}
              />

              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                <Map size={12} />
                {showMap ? "Hide Map" : "Can't find your exact building? Pin it on the map"}
              </button>

              {showMap && isLoaded && (
                <div className="relative mt-4 w-full h-[300px] rounded-lg overflow-hidden border border-border shadow-inner animate-in fade-in zoom-in-95 duration-200">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={coords || { lat: shopLat, lng: shopLng }}
                    zoom={coords ? 17 : 12}
                    onClick={handleMapClick}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                    }}
                  >
                    {coords && (
                      <Marker 
                        position={coords} 
                        draggable={true}
                        onDragEnd={handleMarkerDragEnd} 
                        animation={google.maps.Animation.DROP} 
                      />
                    )}
                  </GoogleMap>
                  
                  <button
                    type="button"
                    onClick={handleLiveLocation}
                    disabled={isLocating}
                    className="absolute bottom-4 left-4 bg-white dark:bg-zinc-900 p-3 rounded-full shadow-lg border border-border hover:scale-105 active:scale-95 transition-all text-blue-600 z-10 flex items-center justify-center"
                    title="Use my current location"
                  >
                    {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Crosshair size={20} />}
                  </button>

                  <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/50 to-transparent p-2 pointer-events-none">
                     <p className="text-[10px] text-center text-white font-bold drop-shadow-md">
                       Search an area, then drag the pin to your exact building.
                     </p>
                  </div>
                </div>
              )}

              {coords ? (
                <div className="mt-3 flex items-center gap-3 text-[10px] bg-neutral-100 dark:bg-zinc-800 p-2 rounded border border-border animate-in fade-in">
                  <Info size={12} className="text-blue-500 shrink-0" />
                  <span className="truncate flex-1">
                    {addressText} (<span className="font-mono font-bold">{distanceKm.toFixed(1)}km</span>)
                  </span>
                  <span className="h-3 w-px bg-border shrink-0" />
                  <span className={cn("font-bold shrink-0", deliveryFee === 0 ? "text-emerald-600" : "text-foreground")}>
                    {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee/100)}
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-2 pl-1">
                  * Search or pin a location to calculate delivery fee.
                </p>
              )}
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">House/Apt NO (For Doorstep Delivery Within Nairobi Metro)</label>
              <input name="houseDetails" placeholder="e.g. Block B, Door 4, Gate code..." className="w-full bg-secondary border border-border p-3 text-sm focus:border-primary outline-none rounded-md transition-all" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}