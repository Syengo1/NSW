'use server';

import { createClient } from '@supabase/supabase-js'; 
import { initiateSTKPush } from '@/lib/services/mpesa';

// --- CONFIG: SHOP LOCATION (Westlands, Nairobi) ---
const SHOP_LOCATION = { lat: -1.3554, lng: 36.6562 }; 

// --- STRICT INTERFACES ---
type CartItem = {
  variantId: string;
  quantity: number;
};

// Interface for the Supabase relational join
interface ProductRelation {
  title: string;
  base_price: number;
  sale_price: number | null;
}

// --- HELPER: Haversine Distance Calculation ---
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 8) return 0;
  if (distanceKm <= 20) return 150 * 100;
  if (distanceKm <= 35) return 200 * 100; 
  if (distanceKm <= 60) return 300 * 100; 
  return 1000 * 100; 
}

export async function processCheckout(formData: FormData, cartItems: CartItem[]) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 1. EXTRACT DATA
  const deliveryMethod = formData.get('deliveryMethod') as string;
  const payerPhone = formData.get('payerPhone') as string;
  const payerName = formData.get('payerName') as string;
  const recipientName = (formData.get('recipientName') as string) || payerName;
  const recipientPhone = (formData.get('recipientPhone') as string) || payerPhone;
  
  const coordinatesStr = formData.get('coordinates') as string;
  const addressText = formData.get('addressText') as string;
  const houseDetails = formData.get('houseDetails') as string;

  if (cartItems.length === 0) return { success: false, error: "Cart is empty" };

  // 2. CALC DELIVERY FEE
  let calculatedDeliveryFee = 0;
  try {
    if (deliveryMethod === 'delivery') {
      if (!coordinatesStr || !addressText) throw new Error("Delivery location required");
      
      const [lat, lng] = coordinatesStr.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid location data");

      // SECURITY: Rough Bounding Box for Kenya
      if (lat < -5 || lat > 5 || lng < 33 || lng > 42) {
        throw new Error("Delivery is currently restricted to Kenya.");
      }

      const distance = calculateDistanceKm(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
      
      if (distance > 100) throw new Error("Location is outside our standard delivery zone.");

      calculatedDeliveryFee = calculateDeliveryFee(distance);
    }
  } catch (e: unknown) {
    // FIX: Replaced `any` with `unknown` and Type Narrowing
    const errorMessage = e instanceof Error ? e.message : "Invalid Delivery Location";
    return { success: false, error: errorMessage };
  }

  try {
    // 3. VALIDATE INVENTORY & CALC TOTALS
    const { data: variants } = await supabase
      .from('variants')
      .select('id, size, color, price_adjustment, stock_quantity, products(title, base_price, sale_price)')
      .in('id', cartItems.map(i => i.variantId));

    if (!variants) return { success: false, error: "System Error: Inventory check failed" };

    let productsTotalCents = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const dbVariant = variants.find(v => v.id === item.variantId);
      if (!dbVariant) return { success: false, error: `Item ${item.variantId} not found` };
      
      // FIX: Cast Supabase relational join strictly instead of using `any`
      const product = dbVariant.products as unknown as ProductRelation;

      // Explicit Check before Database Constraint
      // Now it securely accesses product.title
      if ((dbVariant.stock_quantity ?? 0) < item.quantity) {
        return { 
          success: false, 
          error: `Stock unavailable for ${product.title}. Only ${dbVariant.stock_quantity || 0} left.` 
        };
      }

      const basePrice = product.sale_price || product.base_price;
      const unitPrice = basePrice + (dbVariant.price_adjustment ?? 0);
      
      productsTotalCents += unitPrice * item.quantity;

      orderItemsData.push({
        variant_id: dbVariant.id,
        product_name: product.title,
        variant_name: `Size: ${dbVariant.size || 'STD'}`, 
        quantity: item.quantity,
        price_at_purchase: unitPrice
      });
    }

    const grandTotalCents = productsTotalCents + calculatedDeliveryFee;

    // 4. CREATE ORDER (Pending Payment)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: payerName,
        customer_phone: payerPhone,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        customer_location: deliveryMethod === 'pickup' ? 'STORE PICKUP' : `${addressText} (${houseDetails})`,
        delivery_method: deliveryMethod,
        delivery_fee: calculatedDeliveryFee,
        delivery_coordinates: deliveryMethod === 'delivery' ? coordinatesStr : null,
        total_amount: grandTotalCents,
        status: 'pending_payment'
      })
      .select('id, order_number')
      .single();

    if (orderError) throw new Error(`Order Creation Failed: ${orderError.message}`);

    // 5. SAVE ITEMS (This Trigger Stock Deduction)
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItemsData.map(item => ({ ...item, order_id: order.id }))
    );

    if (itemsError) {
      if (itemsError.message.includes('check_stock_non_negative')) {
        await supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: "One or more items just went out of stock. Please update your cart." };
      }
      throw new Error("Failed to save order items.");
    }

    // 6. TRIGGER M-PESA
    try {
      const res = await initiateSTKPush(payerPhone, grandTotalCents / 100, order.id);
      await supabase.from('orders').update({ mpesa_request_id: res.checkoutRequestId }).eq('id', order.id);
      return { success: true, orderId: order.order_number };
    } catch (e: unknown) {
      // FIX: Replace `any` with `unknown` + Type Narrowing
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("Initial M-Pesa Push Failed:", errorMsg);
      return { success: true, orderId: order.order_number, warning: "Payment push failed. Retry from tracking page." };
    }

  } catch (error: unknown) {
    // FIX: Replace `any` with `unknown` + Type Narrowing
    const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Checkout Process Error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}