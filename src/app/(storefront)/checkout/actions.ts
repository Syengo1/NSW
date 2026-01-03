'use server';

import { createClient } from '@supabase/supabase-js'; 
import { initiateSTKPush } from '@/lib/services/mpesa';

// --- CONFIG: SHOP LOCATION (Westlands, Nairobi) ---
const SHOP_LOCATION = { lat: -1.2636, lng: 36.8028 }; 

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
  if (distanceKm <= 20) return 0; 
  if (distanceKm <= 25) return 10000; 
  return 20000 + (Math.ceil(distanceKm - 25) * 1000); 
}

type CartItem = {
  variantId: string;
  quantity: number;
};

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
      if (!coordinatesStr) throw new Error("Delivery location required");
      const [lat, lng] = coordinatesStr.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid location data");
      const distance = calculateDistanceKm(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
      calculatedDeliveryFee = calculateDeliveryFee(distance);
    }
  } catch (e) {
    return { success: false, error: "Invalid Delivery Location" };
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
      
      // Explicit Check before Database Constraint
      if (dbVariant.stock_quantity < item.quantity) {
        return { 
          success: false, 
          error: `Stock unavailable for ${(dbVariant.products as any).title}. Only ${dbVariant.stock_quantity} left.` 
        };
      }

      const product = dbVariant.products as any;
      const basePrice = product.sale_price || product.base_price;
      const unitPrice = basePrice + dbVariant.price_adjustment;
      
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
      .select()
      .single();

    if (orderError) throw new Error(`Order Creation Failed: ${orderError.message}`);

    // 5. SAVE ITEMS (This Trigger Stock Deduction)
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItemsData.map(item => ({ ...item, order_id: order.id }))
    );

    if (itemsError) {
      // HANDLE RACE CONDITION: 
      // If someone else bought the last item milliseconds before this insert,
      // The DB constraint 'check_stock_non_negative' will fire.
      if (itemsError.message.includes('check_stock_non_negative')) {
        // Rollback: Delete the empty order we just created
        await supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: "One or more items just went out of stock. Please update your cart." };
      }
      throw new Error("Failed to save order items.");
    }

    // 6. TRIGGER M-PESA
    try {
      const res = await initiateSTKPush(payerPhone, grandTotalCents / 100, order.id);
      await supabase.from('orders').update({ mpesa_request_id: res.checkoutRequestId }).eq('id', order.id);
      return { success: true, orderId: order.id };
    } catch (e: any) {
      // SOFT FAIL: If M-Pesa API is down, don't crash the order.
      // Return success so user sees "Processing" page and can use "Retry Payment" button.
      console.error("Initial M-Pesa Push Failed:", e);
      return { success: true, orderId: order.id, warning: "Payment push failed. Retry from tracking page." };
    }

  } catch (error: any) {
    console.error("Checkout Process Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}