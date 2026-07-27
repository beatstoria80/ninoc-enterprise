'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentSupplier } from '@/lib/services/supplier';

export async function requestPickupAction(orderId: string) {
  try {
    const supplier = await getCurrentSupplier();
    
    if (!supplier) {
      return { success: false, error: 'Unauthorized. Supplier not found.' };
    }

    if (!orderId) {
      return { success: false, error: 'Order ID is required.' };
    }

    // Example Backend Logic:
    // 1. Verify supplier owns this order via DB
    // 2. Fetch origin address / coordinates
    // 3. Call Biteship API
    // 4. Update order status in DB to READY_FOR_PICKUP

    // Mock API simulation for UI/UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Revalidate the logistics pages to refresh data without a hard reload
    revalidatePath('/supplier/logistics');
    revalidatePath(`/supplier/logistics/${orderId}`);

    return { 
      success: true, 
      message: 'Pickup requested successfully',
      tracking_id: 'MOCK-TRACK-123'
    };
  } catch (error: any) {
    console.error('Request Pickup Action Error:', error);
    return { success: false, error: error.message || 'Failed to request pickup.' };
  }
}
