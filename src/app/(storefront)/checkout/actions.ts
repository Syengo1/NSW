'use server';

import { createClient } from '@supabase/supabase-js'; 
import { initiateSTKPush } from '@/lib/services/mpesa';

// --- CONFIG: SHOP LOCATION (Westlands, Nairobi) ---
const SHOP_LOCATION = { lat: -1.3554, lng: 36.6562 }; 

// --- STRICT INTERFACES ---
type CartItem = { variantId: string; quantity: number; };

interface ProductRelation {
  title: string;
  base_price: number;
  sale_price: number | null;
  cost_price: number | null; // 🚨 UPGRADE: Required for profit analytics
}

// --- HELPER: Haversine Distance Calculation ---
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
}

function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 8) return 0;
  if (distanceKm <= 20) return 15000;  // 150 KES
  if (distanceKm <= 35) return 20000;  // 200 KES
  if (distanceKm <= 60) return 30000;  // 300 KES
  return 100000; // 1000 KES
}

export async function processCheckout(
  formData: FormData, 
  cartItems: CartItem[], 
  expectedTotalCents: number
) {
  // Service Role securely bypasses RLS for order generation
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const deliveryMethod = formData.get('deliveryMethod') as string;
  const payerName = formData.get('payerName') as string;
  
  // 🚨 UPGRADE: Sanitize phone inputs immediately to ensure pristine database records
  const payerPhone = (formData.get('payerPhone') as string).replace(/\s+/g, '');
  const recipientName = (formData.get('recipientName') as string) || payerName;
  const recipientPhone = ((formData.get('recipientPhone') as string) || payerPhone).replace(/\s+/g, '');
  
  const coordinatesStr = formData.get('coordinates') as string;
  const addressText = formData.get('addressText') as string;
  const houseDetails = (formData.get('houseDetails') as string) || '';

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: "Cart is empty" };
  }

  let calculatedDeliveryFee = 0;

  // 1. VERIFY DELIVERY DISTANCE & FEES
  if (deliveryMethod === 'delivery') {
    try {
      if (!coordinatesStr || !addressText) throw new Error("Delivery location required");
      const [lat, lng] = coordinatesStr.split(',').map(Number);
      
      if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid location data");
      if (lat < -5 || lat > 5 || lng < 33 || lng > 42) throw new Error("Delivery is currently restricted to Kenya.");

      const distance = calculateDistanceKm(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
      if (distance > 100) throw new Error("Location is outside our standard delivery zone.");
      
      calculatedDeliveryFee = calculateDeliveryFee(distance);

    } catch (locationError: unknown) {
      const msg = locationError instanceof Error ? locationError.message : "Invalid Location";
      console.warn("[Checkout Warning] Location calculation failed:", msg);
      return { success: false, error: msg };
    }
  }

  // 2. CORE DATABASE TRANSACTION
  try {
    // 🚨 UPGRADE: Added `cost_price` to the fetch query for profit tracking
    const { data: variants, error: variantError } = await supabase
      .from('variants')
      .select('id, size, color, price_adjustment, stock_quantity, products(title, base_price, sale_price, cost_price)')
      .in('id', cartItems.map(i => i.variantId));

    if (variantError || !variants || variants.length === 0) {
      console.error("[Checkout Error] Variant fetch failed:", variantError);
      return { success: false, error: "Inventory check failed or items removed." };
    }

    let productsTotalCents = 0;
    const orderItemsData = [];

    // 3. BUILD AND VALIDATE THE LEDGER
    for (const item of cartItems) {
      const dbVariant = variants.find(v => v.id === item.variantId);
      if (!dbVariant) return { success: false, error: `An item no longer exists in our catalog.` };
      
      const product = Array.isArray(dbVariant.products) ? dbVariant.products[0] : dbVariant.products as unknown as ProductRelation;

      if ((dbVariant.stock_quantity ?? 0) < item.quantity) {
        return { 
          success: false, 
          error: `Stock unavailable for ${product.title}. Only ${dbVariant.stock_quantity || 0} left.`,
          triggerSync: true 
        };
      }

      const basePrice = product.sale_price || product.base_price;
      const unitPrice = basePrice + (dbVariant.price_adjustment ?? 0);
      productsTotalCents += unitPrice * item.quantity;

      orderItemsData.push({
        variant_id: dbVariant.id,
        product_name: product.title,
        variant_name: `Size: ${dbVariant.size || 'STD'} - ${dbVariant.color}`, 
        quantity: item.quantity,
        price_at_purchase: unitPrice,
        cost_at_purchase: product.cost_price || 0 // 🚨 UPGRADE: Captures exact cost for dynamic profit metrics
      });
    }

    const grandTotalCents = productsTotalCents + calculatedDeliveryFee;

    // --- ANTI-STALE SECURITY LOCK ---
    if (grandTotalCents !== expectedTotalCents) {
        console.warn(`[Checkout Warning] Price mismatch blocked. Expected: ${expectedTotalCents}, Actual DB: ${grandTotalCents}`);
        return { 
            success: false, 
            error: "Prices or delivery fees updated in the system while you were waiting. Please review your new total.",
            triggerSync: true
        };
    }

    // 4. CREATE ORDER
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: payerName, customer_phone: payerPhone,
        recipient_name: recipientName, recipient_phone: recipientPhone,
        customer_location: deliveryMethod === 'pickup' ? 'STORE PICKUP' : `${addressText} ${houseDetails ? `(${houseDetails})` : ''}`.trim(),
        delivery_method: deliveryMethod, delivery_fee: calculatedDeliveryFee,
        delivery_coordinates: deliveryMethod === 'delivery' ? coordinatesStr : null,
        total_amount: grandTotalCents, status: 'pending_payment'
      }).select('id, order_number').single();

    if (orderError) {
      console.error("[Checkout Error] Order creation failed:", orderError);
      throw new Error(`Order Creation Failed`);
    }

    // 5. INSERT ITEMS (This evaluates your Database Stock Constraints)
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItemsData.map(item => ({ ...item, order_id: order.id }))
    );

    // ROBUSTNESS UPGRADE: Failsafe Rollback Handling
    if (itemsError) {
      console.error("[Checkout Error] Order items insertion failed:", itemsError);
      
      // Manual rollback to prevent dead stock loops
      const { error: rollbackError } = await supabase.from('orders').delete().eq('id', order.id);
      if (rollbackError) console.error(`[CRITICAL LEAK] Failed to rollback orphaned order ID ${order.id}:`, rollbackError);

      // 🚨 UPGRADE: Stringify the entire error object. PostgreSQL often buries constraint names in the .details or .hint keys.
      if (JSON.stringify(itemsError).includes('check_stock_non_negative')) {
        return { success: false, error: "Someone just bought the last unit of an item in your cart!", triggerSync: true };
      }
      throw new Error("Failed to save order items.");
    }

    // 6. INITIATE M-PESA STK PUSH
    try {
      const res = await initiateSTKPush(payerPhone, grandTotalCents / 100, order.order_number);
      
      const { error: updateError } = await supabase.from('orders').update({ mpesa_request_id: res.checkoutRequestId }).eq('id', order.id);
      
      // 🚨 UPGRADE: Critical system logging. If this update fails, the Webhook will not be able to find the order.
      if (updateError) {
         console.error(`[CRITICAL DB ERROR] Failed to link M-Pesa Request ID ${res.checkoutRequestId} to Order ${order.order_number}`);
      }

      return { success: true, orderId: order.order_number };

    } catch (mpesaError: unknown) {
      console.error("[Daraja Gateway Error] M-Pesa STK Push Failed:", mpesaError);
      
      // We do not fail the order here. Safaricom might just be temporarily down. 
      // The order exists in a 'pending_payment' state and the user can safely retry it from their tracking page.
      return { 
         success: true, 
         orderId: order.order_number, 
         warning: "Payment push failed. Safaricom might be delayed. You can retry the payment directly from your tracking page." 
      };
    }

  } catch (globalError: unknown) {
    console.error("[Checkout Error] Global processing crash:", globalError);
    return { 
      success: false, 
      error: globalError instanceof Error ? globalError.message : "An unexpected server error occurred" 
    };
  }
}