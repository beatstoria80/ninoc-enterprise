'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { supabase } from '@/lib/supabase';

export async function requestPickupAction(orderId: string) {
  try {
    const supplier = await getCurrentSupplier();
    
    if (!supplier) {
      return { success: false, error: 'Unauthorized. Supplier not found.' };
    }

    if (!orderId) {
      return { success: false, error: 'Order ID is required.' };
    }

    // 1. Verify supplier owns this order via DB
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items!inner(id, supplier_id, product_name, quantity, price_at_purchase)')
      .eq('id', orderId)
      .eq('order_items.supplier_id', supplier.supplier_id)
      .single();

    if (orderError || !orderData) {
      return { success: false, error: 'Order not found or access denied.' };
    }

    if (orderData.tracking_id) {
      return { success: false, error: 'Order already has a tracking ID.' };
    }

    // 2. Fetch origin warehouse for this supplier
    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('*')
      .eq('supplier_id', supplier.supplier_id)
      .limit(1)
      .single();

    if (!warehouse) {
      return { success: false, error: 'Warehouse address not configured for this supplier.' };
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey || apiKey === 'your_biteship_api_key_here') {
      return { success: false, error: 'Biteship API key not configured.' };
    }

    // Parse courier (e.g. "JNE REG" -> company "jne", type "reg")
    const courierParts = (orderData.courier || '').toLowerCase().split(' ');
    const courier_company = courierParts[0] || 'jne';
    const courier_type = courierParts.slice(1).join('') || 'reg';

    const dest = orderData.shipping_address as any || {};

    const biteshipPayload = {
      external_id: orderId,
      courier_company: courier_company,
      courier_type: courier_type,
      origin: {
        contact_name: warehouse.name || supplier.suppliers?.name,
        contact_phone: supplier.suppliers?.contact_phone || '00000000',
        address: warehouse.address_line || '',
        postal_code: parseInt(warehouse.postal_code, 10) || 40292
      },
      destination: {
        contact_name: dest.name || orderData.customer_name || 'Buyer',
        contact_phone: dest.phone || orderData.customer_phone || '00000000',
        address: dest.full_address || dest.address || 'Alamat tidak tersedia',
        postal_code: parseInt(dest.postal_code, 10) || 40292
      },
      items: orderData.order_items.map((it: any) => ({
        name: it.product_name,
        value: it.price_at_purchase,
        quantity: it.quantity,
        weight: 100 // fallback
      }))
    };

    // 3. Call Biteship API
    const response = await fetch('https://api.biteship.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(biteshipPayload),
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      console.warn('[Biteship Supplier] API Error:', data);
      return { success: false, error: data.error || 'Failed to request pickup from Biteship.' };
    }

    // 4. Update order status in DB to READY_FOR_PICKUP
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        tracking_id: data.waybill_id,
        status: 'ready_for_pickup',
        courier: `${data.courier_company} ${data.courier_type}`.toUpperCase()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order tracking ID:', updateError);
      return { success: false, error: 'Pickup requested, but failed to save tracking ID.' };
    }

    revalidatePath('/supplier/logistics');
    revalidatePath(`/supplier/logistics/${orderId}`);

    return { 
      success: true, 
      message: 'Pickup requested successfully',
      tracking_id: data.waybill_id
    };
  } catch (error: any) {
    console.error('Request Pickup Action Error:', error);
    return { success: false, error: error.message || 'Failed to request pickup.' };
  }
}
