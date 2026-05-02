'use client';

import { useCartStore } from '@/lib/store/cart';
import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, Lock, Smartphone, ArrowLeft, User, Truck, 
  Store, Info, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Map, Crosshair 
} from 'lucide-react';
import { processCheckout } from './actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// GOOGLE MAPS INTEGRATION
import AddressAutocomplete from '@/components/storefront/AddressAutocomplete';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

// --- CONFIG ---
const SHOP_LAT = -1.2636;
const SHOP_LNG = 36.8028;
const LIBRARIES: ("places")[] = ["places"];
const KENYA_PHONE_REGEX = /^(?:254|\+254|0)?((?:7|1)(?:(?:[0-9][0-9])|(?:[0-9][0-9])|(?:[0-9][0-9]))[0-9]{6})$/;

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const router = useRouter();
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [separateRecipient, setSeparateRecipient] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);

  const [addressText, setAddressText] = useState("");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const cartTotal = getCartTotal();
  const grandTotal = cartTotal + deliveryFee;

  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setDeliveryFee(0);
      return;
    }

    if (coords) {
      const R = 6371; 
      const dLat = (coords.lat - SHOP_LAT) * (Math.PI/180);
      const dLon = (coords.lng - SHOP_LNG) * (Math.PI/180);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(SHOP_LAT * (Math.PI/180)) * Math.cos(coords.lat * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c; 
      
      setDistanceKm(d);

      if (d <= 8) setDeliveryFee(0);
      else if (d <= 20) setDeliveryFee(0); 
      else if (d <= 25) setDeliveryFee(10000); 
      else setDeliveryFee(20000 + (Math.ceil(d - 25) * 1000));
    }
  }, [coords, deliveryMethod]);

  useEffect(() => {
    if (phone.length > 3) {
       setPhoneError(!KENYA_PHONE_REGEX.test(phone));
    } else {
       setPhoneError(false);
    }
  }, [phone]);

  // --- NEW: CENTRALIZED REVERSE GEOCODING HELPER ---
  const updateLocationFromLatLng = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng });
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setAddressText(results[0].formatted_address);
      } else {
        setAddressText(`Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    });
  }, []);

  // --- MAP INTERACTION HANDLERS ---
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocationFromLatLng(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationFromLatLng]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocationFromLatLng(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationFromLatLng]);

  // --- LIVE GPS LOCATOR ---
  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser does not support GPS location.");
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocationFromLatLng(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
        toast.success("Location locked!");
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS Error:", err.message);
        if (err.code === 1) toast.error("Please allow location permissions in your browser.");
        else toast.error("Location signal weak. Try stepping outside or searching manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // --- SUBMISSION HANDLER ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (phoneError) {
      toast.error("Please enter a valid M-Pesa phone number");
      document.getElementById('phone-input')?.focus();
      return;
    }
    if (deliveryMethod === 'delivery' && (!coords || !addressText)) {
      toast.error("Please search and select a valid delivery location");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    formData.append('deliveryMethod', deliveryMethod);
    if (coords && addressText) {
       formData.append('coordinates', `${coords.lat},${coords.lng}`);
       formData.append('addressText', addressText);
    }

    try {
      const result = await processCheckout(formData, items);

      if (result.success) {
        clearCart();
        toast.success("Order created! Check your phone.");
        router.push(`/track-order/${result.orderId}`);
      } else {
        if (result.warning) toast.warning(result.warning);
        else toast.error(result.error || "Payment failed.");
        
        setError(result.error || "Transaction failed");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection error. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground animate-fade-in p-6 text-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Cart Empty</h2>
        <p className="text-muted-foreground mb-6">Your bag is looking a bit light.</p>
        <Link href="/shop" className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">
           Return to Drop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-foreground py-6 md:py-12 px-4 animate-slide-up pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        
        {/* --- LEFT COLUMN: CHECKOUT FORM --- */}
        <div className="lg:col-span-7 space-y-8">
           
           <div className="flex items-center justify-between">
              <Link href="/shop" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
              </Link>
              <div className="text-[10px] font-mono text-muted-foreground bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-border">
                SECURE CHECKOUT
              </div>
           </div>
           
           <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Checkout</h1>

           <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
             
             {/* 1. DELIVERY METHOD CARD */}
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

               {/* SMART CONTENT SWITCHER */}
               <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                 {deliveryMethod === 'pickup' ? (
                   <div className="flex gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg">
                     <Store size={20} className="shrink-0 mt-1" />
                     <div>
                       <p className="font-bold uppercase text-sm">The Alchemist, Westlands</p>
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
                        
                        {/* 1. GOOGLE AUTOCOMPLETE SEARCH */}
                        <AddressAutocomplete 
                          selectedAddress={addressText}
                          onLocationSelect={(address, newCoords) => {
                            setAddressText(address);
                            setCoords(newCoords);
                            setShowMap(true); // FIX: Always ensure map is visible so they can drag the pin to refine
                          }}
                          onAddressEdit={(text) => setAddressText(text)}
                        />

                        {/* 2. MANUAL MAP TOGGLE */}
                        <button
                          type="button"
                          onClick={() => setShowMap(!showMap)}
                          className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Map size={12} />
                          {showMap ? "Hide Map" : "Can't find your exact building? Pin it on the map"}
                        </button>

                        {/* 3. VISUAL GOOGLE MAP */}
                        {showMap && isLoaded && (
                          <div className="relative mt-4 w-full h-[300px] rounded-lg overflow-hidden border border-border shadow-inner animate-in fade-in zoom-in-95 duration-200">
                            <GoogleMap
                              mapContainerStyle={{ width: '100%', height: '100%' }}
                              center={coords || { lat: SHOP_LAT, lng: SHOP_LNG }}
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
                                  draggable={true} // FIX: Make it editable!
                                  onDragEnd={handleMarkerDragEnd} // FIX: Update search bar when dragging ends
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
                              {isLocating ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <Crosshair size={20} /> 
                              )}
                            </button>

                            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/50 to-transparent p-2 pointer-events-none">
                               <p className="text-[10px] text-center text-white font-bold drop-shadow-md">
                                 Search an area, then drag the pin to your exact building.
                               </p>
                            </div>
                          </div>
                        )}

                        {/* SMART DISTANCE FEEDBACK */}
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
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">House / Apt Details (Optional)</label>
                        <input name="houseDetails" placeholder="e.g. Block B, Door 4, Gate code..." className="w-full bg-secondary border border-border p-3 text-sm focus:border-primary outline-none rounded-md transition-all" />
                     </div>
                   </div>
                 )}
               </div>
             </div>

             {/* 2. CONTACT CARD */}
             <div className="bg-white dark:bg-zinc-900 p-6 shadow-sm border border-border rounded-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-black dark:bg-white" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User size={14} /> Contact Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Payer Name</label>
                    <input name="payerName" required placeholder="JOMO KENYATTA" className="w-full bg-secondary border border-border p-3 text-sm font-bold uppercase focus:border-primary outline-none rounded-md" />
                  </div>
                  <div>
                    <div className="flex justify-between">
                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">M-Pesa Number</label>
                       {phoneError && <span className="text-[10px] text-red-500 font-bold animate-pulse">Invalid Format</span>}
                    </div>
                    <div className="relative group">
                      <Smartphone className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", phoneError ? "text-red-500" : "text-muted-foreground group-focus-within:text-primary")} size={16} />
                      <input 
                        id="phone-input"
                        name="payerPhone" 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required 
                        placeholder="0712 345 678" 
                        className={cn(
                           "w-full bg-secondary border p-3 pl-10 text-sm font-mono outline-none rounded-md transition-all",
                           phoneError ? "border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10" : "border-border focus:border-primary"
                        )} 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Prompt will be sent to this number.</p>
                  </div>
                </div>

                {/* Recipient Toggle */}
                <div className="pt-2">
                   <label className="flex items-center gap-3 cursor-pointer group w-fit">
                      <div className={cn("w-5 h-5 border-2 rounded flex items-center justify-center transition-colors", separateRecipient ? "bg-black border-black dark:bg-white dark:border-white" : "border-muted-foreground")}>
                         {separateRecipient && <CheckCircle2 size={14} className="text-white dark:text-black" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={separateRecipient} onChange={(e) => setSeparateRecipient(e.target.checked)} />
                      <span className="text-xs font-bold uppercase select-none group-hover:text-primary transition-colors">Gift / Someone else receiving</span>
                   </label>
                </div>

                {separateRecipient && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-dashed border-border">
                     <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Recipient Name</label><input name="recipientName" required placeholder="Recipient Name" className="w-full bg-secondary border border-border p-3 text-sm font-bold uppercase focus:border-primary outline-none rounded-md" /></div>
                     <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Recipient Phone</label><input name="recipientPhone" type="tel" required placeholder="07XX XXX XXX" className="w-full bg-secondary border border-border p-3 text-sm font-mono focus:border-primary outline-none rounded-md" /></div>
                  </div>
                )}
             </div>

           </form>
        </div>

        {/* --- RIGHT COLUMN: SUMMARY (STICKY) --- */}
        <div className="lg:col-span-5 relative">
           <div className="sticky top-24 space-y-6">
              
              <button 
                 onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                 className="lg:hidden w-full flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-lg border border-border shadow-sm"
              >
                 <span className="font-bold uppercase text-sm flex items-center gap-2"><div className="bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{items.length}</div> Order Summary</span>
                 {mobileSummaryOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </button>

              <div className={cn("bg-white dark:bg-zinc-900 border border-border p-6 lg:p-8 shadow-xl rounded-xl transition-all", !mobileSummaryOpen && "hidden lg:block")}>
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                     Your Bag <span className="text-muted-foreground text-sm font-normal">({items.length} items)</span>
                  </h2>
                  
                  <div className="space-y-4 max-h-[35vh] overflow-y-auto scrollbar-thin mb-6 pr-2">
                     {items.map(item => (
                       <div key={item.variantId} className="flex gap-4 text-sm group">
                          <div className="relative w-14 h-16 bg-secondary shrink-0 rounded overflow-hidden border border-border">
                             <Image 
                               src={item.image} 
                               alt={item.name || "Product Image"}
                               fill
                               sizes="(max-width: 768px) 100vw, 50vw"
                               className="object-cover group-hover:scale-110 transition-transform duration-500" 
                             />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold block uppercase text-xs truncate">{item.name}</span>
                            <span className="text-muted-foreground text-[10px] uppercase font-mono">{item.color} / {item.size}</span>
                            <div className="text-[10px] mt-1 text-muted-foreground">Qty: {item.quantity}</div>
                          </div>
                          <div className="font-mono text-xs font-bold">
                            {formatCurrency((item.price * item.quantity)/100)}
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="border-t border-dashed border-border pt-4 space-y-3 text-sm">
                     <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-mono text-foreground">{formatCurrency(cartTotal/100)}</span>
                     </div>
                     <div className="flex justify-between text-muted-foreground items-center">
                        <span className="flex items-center gap-2">Delivery {deliveryMethod === 'pickup' && <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded">PICKUP</span>}</span>
                        {deliveryMethod === 'pickup' ? (
                           <span className="text-xs font-bold uppercase text-emerald-600">Free</span>
                        ) : (
                           <span className={cn("font-mono", deliveryFee === 0 ? "text-emerald-600 font-bold" : "text-foreground")}>
                              {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee/100)}
                           </span>
                        )}
                     </div>
                     
                     <div className="flex justify-between text-xl font-black uppercase pt-4 border-t border-border mt-2">
                        <span>Total</span>
                        <span className="text-emerald-600">{formatCurrency(grandTotal/100)}</span>
                     </div>
                  </div>

                  <div className="mt-8 space-y-4">
                     <div className="bg-secondary/50 p-3 rounded border border-border flex gap-3 items-start">
                        <Info size={16} className="text-primary mt-0.5 shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-tight">
                           By clicking pay, you&apos;ll receive an M-Pesa prompt on <span className="font-mono font-bold text-foreground">{phone || 'your phone'}</span>.
                        </p>
                     </div>

                     {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold uppercase rounded flex items-center gap-2 animate-pulse">
                          <AlertCircle size={16} /> {error}
                        </div>
                     )}

                     <button 
                       type="submit"
                       form="checkout-form" 
                       disabled={loading || (deliveryMethod === 'delivery' && (!coords || !addressText)) || phoneError}
                       className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 rounded-sm shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {loading ? <Loader2 className="animate-spin" /> : `Pay ${formatCurrency(grandTotal/100)}`}
                     </button>

                     <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest opacity-70">
                        <Lock size={10} />
                        <span>Secured by Safaricom M-Pesa</span>
                     </div>
                  </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}