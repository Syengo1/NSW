// src/app/(storefront)/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { processCheckout } from './actions';
import { useLoadScript } from '@react-google-maps/api';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// MODULAR FEATURE SPLITS
import { FulfillmentSection } from '@/components/storefront/checkout/FulfillmentSection';
import { ContactSection } from '@/components/storefront/checkout/ContactSection';
import { OrderSummary } from '@/components/storefront/checkout/OrderSummary';

// --- CONFIG ---
const SHOP_LAT = -1.3554;
const SHOP_LNG = 36.6562;
const LIBRARIES: ("places")[] = ["places"];
const KENYA_PHONE_REGEX = /^(?:254|\+254|0)?((?:7|1)(?:(?:[0-9][0-9])|(?:[0-9][0-9])|(?:[0-9][0-9]))[0-9]{6})$/;

// Strict Typing for Supabase Relational Payload
interface SupabaseVariantResponse {
  id: string;
  stock_quantity: number | null;
  price_adjustment: number | null;
  products: 
    | { base_price: number; sale_price: number | null }
    | { base_price: number; sale_price: number | null }[]
    | null;
}

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart, syncCart } = useCartStore();
  const router = useRouter();
  
  // GOLD STANDARD 1: The Transaction Success Lock
  // Prevents the "Sold Out" Safety Eject from firing when the cart is cleared post-purchase
  const isSuccess = useRef(false);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  // Global Orchestration States
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [separateRecipient, setSeparateRecipient] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);

  const [addressText, setAddressText] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const cartTotal = getCartTotal();
  const grandTotal = cartTotal + deliveryFee;

  // --- 🔄 REAL-TIME CART POLLING & STALE DATA PREVENTION ---
  const variantIdsStr = useMemo(() => items.map(i => i.variantId).sort().join(','), [items]);

  const syncLiveData = useCallback(async () => {
    // If checkout was already successful, do not sync background data
    if (!variantIdsStr || !syncCart || isSuccess.current) return;

    const variantIds = variantIdsStr.split(',');
    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from('variants')
      .select('id, stock_quantity, price_adjustment, products ( base_price, sale_price )')
      .in('id', variantIds);

    if (data && !fetchError) {
      const freshData = (data as SupabaseVariantResponse[]).map((variant) => {
        const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
        const basePrice = product?.sale_price || product?.base_price || 0;
        
        return {
          variantId: variant.id,
          price: basePrice + (variant.price_adjustment || 0),
          originalPrice: product?.sale_price ? (product?.base_price || 0) + (variant.price_adjustment || 0) : undefined,
          maxStock: variant.stock_quantity || 0,
        };
      });
      
      syncCart(freshData); 
    }
  }, [variantIdsStr, syncCart]);

  // Safely mark client as mounted
  useEffect(() => setMounted(true), []);

  // Sync on mount and immediately when the user returns to this tab
  useEffect(() => {
    syncLiveData();
    window.addEventListener('focus', syncLiveData);
    return () => window.removeEventListener('focus', syncLiveData);
  }, [syncLiveData]);

  // Safety Eject: Bounces user if items are removed due to stock outs
  useEffect(() => {
    // Only fire if the cart emptied unexpectedly, bypassing if checkout was successful
    if (mounted && items.length === 0 && !isSuccess.current) {
      toast.error("An item in your cart just sold out! Please select another piece.");
      router.push('/shop');
    }
  }, [mounted, items.length, router]);


  // --- LOGISTICS CALCULATIONS ---
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
      else if (d <= 20) setDeliveryFee(15000);
      else if (d <= 35) setDeliveryFee(20000); 
      else if (d <= 60) setDeliveryFee(30000); 
      else setDeliveryFee(100000);
    }
  }, [coords, deliveryMethod]);

  // Phone Validation Checker (Debounced UI response)
  useEffect(() => {
    if (phone.length > 3) {
       setPhoneError(!KENYA_PHONE_REGEX.test(phone));
    } else {
       setPhoneError(false);
    }
  }, [phone]);

  // GOLD STANDARD 2: Defensive Reverse Geocoding
  const updateLocationFromLatLng = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng });
    
    // Fallback if Google Maps fails to load or network drops
    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
      setAddressText(`Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setAddressText(results[0].formatted_address);
      } else {
        // Degrade gracefully if the API hits a rate limit or returns ZERO_RESULTS
        setAddressText(`Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    });
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocationFromLatLng(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationFromLatLng]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocationFromLatLng(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationFromLatLng]);

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
        if (err.code === 1) toast.error("Please allow location permissions in your browser.");
        else toast.error("Location signal weak. Try searching manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // --- SUBMISSION HANDLER ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // GOLD STANDARD 3: Strict Front-End Validation Guards
    if (!acceptedTerms) {
      toast.error("You must accept the terms and conditions to proceed.");
      return;
    }
    if (phoneError || !phone) {
      toast.error("Please enter a valid M-Pesa phone number.");
      // UX Polish: Automatically focus the input for the user
      document.getElementById('phone-input')?.focus(); 
      return;
    }
    if (deliveryMethod === 'delivery' && (!coords || !addressText)) {
      toast.error("Please search and select a valid delivery location.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('deliveryMethod', deliveryMethod);
    
    if (coords && addressText) {
       formData.append('coordinates', `${coords.lat},${coords.lng}`);
       formData.append('addressText', addressText);
    }

    const cartItemsForAction = items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));

    try {
      const result = await processCheckout(formData, cartItemsForAction, grandTotal);

      if (result.success) {
        // GOLD STANDARD 4: Lock the successful state before clearing the cart
        isSuccess.current = true;
        
        clearCart();
        toast.success("Order created! Check your phone.");
        router.push(`/track-order/${result.orderId}`);
      } else {
        if (result.warning) toast.warning(result.warning);
        else toast.error(result.error || "Payment failed.");
        
        setError(result.error || "Transaction failed");
        
        // UX Polish: Scroll to the error banner smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (result.triggerSync) {
           syncLiveData();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection error. Please try again.";
      setError(msg);
      toast.error("Network error. Please check your connection.");
    } finally {
      // Only remove the loading state if we haven't successfully transitioned to the next page
      if (!isSuccess.current) {
        setLoading(false);
      }
    }
  };

  if (!mounted) return null; 

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Cart Empty</h2>
        <p className="text-muted-foreground mb-6">Your bag is looking a bit light.</p>
        <Link href="/shop" className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">
           Return to Drop
        </Link>
      </div>
    );
  }

  const isSubmitDisabled = 
    loading || 
    !acceptedTerms || 
    phoneError || 
    (deliveryMethod === 'delivery' && (!coords || !addressText));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-foreground py-6 md:py-6 px-4 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        
        {/* FORM REGISTRATION COLUMN */}
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
             {/* Note: Pass loadError down if you want FulfillmentSection to show a map failure banner */}
             <FulfillmentSection 
               deliveryMethod={deliveryMethod}
               setDeliveryMethod={setDeliveryMethod}
               addressText={addressText}
               setAddressText={setAddressText}
               coords={coords}
               setCoords={setCoords}
               showMap={showMap}
               setShowMap={setShowMap}
               isLoaded={isLoaded}
               isLocating={isLocating}
               distanceKm={distanceKm}
               deliveryFee={deliveryFee}
               shopLat={SHOP_LAT}
               shopLng={SHOP_LNG}
               handleMapClick={handleMapClick}
               handleMarkerDragEnd={handleMarkerDragEnd}
               handleLiveLocation={handleLiveLocation}
             />

             <ContactSection 
               phone={phone}
               setPhone={setPhone}
               phoneError={phoneError}
               separateRecipient={separateRecipient}
               setSeparateRecipient={setSeparateRecipient}
             />
           </form>
        </div>

        {/* SUMMARY VISUAL OVERVIEW COLUMN */}
        <div className="lg:col-span-5 relative">
          <OrderSummary 
            items={items}
            cartTotal={cartTotal}
            deliveryFee={deliveryFee}
            grandTotal={grandTotal}
            deliveryMethod={deliveryMethod}
            phone={phone}
            loading={loading}
            error={error}
            mobileSummaryOpen={mobileSummaryOpen}
            setMobileSummaryOpen={setMobileSummaryOpen}
            acceptedTerms={acceptedTerms}
            setAcceptedTerms={setAcceptedTerms}
            isSubmitDisabled={isSubmitDisabled}
          />
        </div>

      </div>
    </div>
  );
}