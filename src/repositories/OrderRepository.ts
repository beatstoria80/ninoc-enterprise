import { SupabaseClient } from '@supabase/supabase-js';
import { CustomerDetails, ShippingDetails } from '@/domain/checkout/CheckoutValidator';

export class OrderRepository {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetches product catalog with costings and variants in a single query.
   */
  public async getProductsByIds(productIds: string[]) {
    return await this.db
      .from('products')
      .select(`
        id, price, name, supplier_id,
        product_costings ( supplier_base_price, supplier_surcharge_cost, ninoc_markup ),
        variants ( id, size, color )
      `)
      .in('id', productIds);
  }

  /**
   * Upserts customer address cleanly.
   */
  public async upsertCustomerAddress(userId: string, customer: CustomerDetails, firstName: string, lastName: string) {
    const addressType = customer.address_type || 'Home';
    try {
      const { data: existing } = await this.db
        .from('customer_addresses')
        .select('id')
        .eq('user_id', userId)
        .eq('address_type', addressType)
        .maybeSingle();

      const payload = {
        user_id: userId,
        address_type: addressType,
        first_name: firstName,
        last_name: lastName,
        phone: customer.phone || '',
        street: (customer.street || '').toUpperCase(),
        house_number: (customer.house_number || '').toUpperCase(),
        rt: customer.rt || '',
        rw: customer.rw || '',
        kelurahan: (customer.kelurahan || '').toUpperCase(),
        kecamatan: (customer.kecamatan || '').toUpperCase(),
        city: (customer.city || '').toUpperCase(),
        province: (customer.province || '').toUpperCase(),
        postal_code: customer.postal_code || '',
      };

      if (existing) {
        await this.db.from('customer_addresses').update(payload).eq('id', existing.id);
      } else {
        await this.db.from('customer_addresses').insert({ ...payload, is_default: addressType === 'Home' });
      }
    } catch (e) {
      console.error('[OrderRepository] Failed to upsert customer address:', e);
    }
  }

  /**
   * Creates draft order, order items, and reserves inventory with automatic rollback on failure.
   */
  public async createOrderWithInventoryLock(
    orderId: string,
    grossAmount: number,
    affiliateId: string | null,
    customer: CustomerDetails,
    shipping: ShippingDetails,
    firstName: string,
    lastName: string,
    dbOrderItems: any[]
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Insert order header
    const { error: orderError } = await this.db.from('orders').insert({
      id: orderId,
      user_id: customer.user_id || null,
      affiliate_id: affiliateId,
      customer_name: customer.name || `${firstName} ${lastName}`.trim() || null,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      total_price: grossAmount,
      status: 'pending',
      payment_status: 'pending',
      courier: shipping.method,
      shipping_address: {
        ...customer,
        first_name: firstName,
        last_name: lastName,
        address: (customer.address || '').toUpperCase(),
        city: (customer.city || '').toUpperCase(),
        shipping_method: shipping.method,
        shipping_cost: shipping.cost,
      },
    });

    if (orderError) {
      console.error('[OrderRepository] Order insert failed:', orderError);
      return { success: false, error: `Failed to create order: ${orderError.message}` };
    }

    // 2. Insert items with foreign key to orderId
    const itemsPayload = dbOrderItems.map(item => ({ ...item, order_id: orderId }));
    const { error: itemsError } = await this.db.from('order_items').insert(itemsPayload);

    if (itemsError) {
      await this.rollbackOrder(orderId);
      console.error('[OrderRepository] Order items insert failed:', itemsError);
      return { success: false, error: `DB Error (Items): ${itemsError.message}` };
    }

    // 3. Row-level inventory reservation lock via RPC
    const { error: invError } = await this.db.rpc('reserve_inventory', { p_order_id: orderId });

    if (invError) {
      await this.rollbackOrder(orderId);
      console.error('[OrderRepository] Inventory reservation failed:', invError);
      return { success: false, error: `DB Error (Inventory): ${invError.message}` };
    }

    return { success: true };
  }

  /**
   * Updates Snap Token once generated.
   */
  public async updateSnapToken(orderId: string, snapToken: string) {
    await this.db.from('orders').update({ snap_token: snapToken }).eq('id', orderId);
  }

  /**
   * Compensating rollback helper.
   */
  private async rollbackOrder(orderId: string) {
    try {
      await this.db.from('orders').delete().eq('id', orderId);
    } catch (e) {
      console.error(`[OrderRepository] Critical: Rollback failed for order ${orderId}:`, e);
    }
  }
}
