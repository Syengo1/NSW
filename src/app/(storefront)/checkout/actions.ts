'use server';

import { createClient } from '@supabase/supabase-js';
import { initiateSTKPush } from '@/lib/services/mpesa';

// --- CONFIG: SHOP LOCATION (Westlands, Nairobi) ---
const SHOP_LOCATION = { lat: -1.2636, lng: 36.8028 }; 

type CartItem = {
  variantId: string;
  quantity: number;
};

// --- HELPER: Haversine Distance Calculation (Server Side Security) ---
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function calculateDeliveryFee(distanceKm: number): number {
  // Logic: 0-8km Free, 9-13km 50, 14-25km 100, >25km 200 + 10/km
  if (distanceKm <= 8) return 0;
  if (distanceKm <= 20) return 0; // 50 KES in cents
  if (distanceKm <= 25) return 10000; // 100 KES in cents
  
  // Long distance logic
  return 20000 + (Math.ceil(distanceKm - 25) * 1000); // 200 base + 10bob per extra km
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
  
  // Recipient info (defaults to payer if not provided, usually handled in frontend but good fallback)
  const recipientName = (formData.get('recipientName') as string) || payerName;
  const recipientPhone = (formData.get('recipientPhone') as string) || payerPhone;
  
  // Location Data
  const coordinatesStr = formData.get('coordinates') as string; // "lat,lng"
  const addressText = formData.get('addressText') as string;
  const houseDetails = formData.get('houseDetails') as string;

  if (cartItems.length === 0) throw new Error("Cart is empty");

  // 2. SERVER-SIDE FEE CALCULATION (SECURITY)
  let calculatedDeliveryFee = 0;
  
  if (deliveryMethod === 'delivery') {
    if (!coordinatesStr) throw new Error("Delivery location required");
    
    const [lat, lng] = coordinatesStr.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid location data");

    const distance = calculateDistanceKm(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
    calculatedDeliveryFee = calculateDeliveryFee(distance);
  }

  // 3. VALIDATE INVENTORY & CALCULATE TOTAL
  const { data: variants } = await supabase
    .from('variants')
    .select('id, price_adjustment, stock_quantity, products(title, base_price, sale_price)')
    .in('id', cartItems.map(i => i.variantId));

  if (!variants) throw new Error("Inventory check failed");

  let productsTotalCents = 0;
  const orderItemsData = [];

  for (const item of cartItems) {
    const dbVariant = variants.find(v => v.id === item.variantId);
    if (!dbVariant) throw new Error(`Item ${item.variantId} unavailable`);
    if (dbVariant.stock_quantity < item.quantity) throw new Error(`Stock error on ${dbVariant.id}`);

    const product = dbVariant.products as any;
    // Use Sale Price if exists, otherwise Base
    const basePrice = product.sale_price || product.base_price;
    const unitPrice = basePrice + dbVariant.price_adjustment;
    
    productsTotalCents += unitPrice * item.quantity;

    orderItemsData.push({
      variant_id: dbVariant.id,
      product_name: product.title,
      quantity: item.quantity,
      price_at_purchase: unitPrice
    });
  }

  // 4. FINAL TOTAL
  const grandTotalCents = productsTotalCents + calculatedDeliveryFee;

  // 5. CREATE ORDER
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

  if (orderError) throw new Error(orderError.message);

  // 6. SAVE ITEMS
  await supabase.from('order_items').insert(
    orderItemsData.map(item => ({ ...item, order_id: order.id }))
  );

  // 7. TRIGGER M-PESA (Using the PAYER phone)
  try {
    const res = await initiateSTKPush(payerPhone, grandTotalCents / 100, order.id);
    await supabase.from('orders').update({ mpesa_request_id: res.checkoutRequestId }).eq('id', order.id);
    return { success: true, orderId: order.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}