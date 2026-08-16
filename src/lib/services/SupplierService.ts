import { createClient } from '@/utils/supabase/server';
import { SupplierRepository } from '@/repositories/SupplierRepository';
import { getCurrentSupplier } from './supplier';

export class SupplierService {
  private getRepository(supabaseAdmin: any) {
    return new SupplierRepository(supabaseAdmin);
  }

  /**
   * Encapsulates the cached retrieval of the supplier's context.
   */
  public async getCurrentSupplierContext() {
    return await getCurrentSupplier();
  }

  public async getLogisticsOrders(supplierId: string) {
    // Gunakan singleton supabaseAdmin untuk mencegah connection pool exhaustion
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
    
    const repository = this.getRepository(supabaseAdmin);
    return await repository.getLogisticsOrders(supplierId);
  }
}
