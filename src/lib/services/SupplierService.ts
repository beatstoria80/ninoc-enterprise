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

  /**
   * Retrieves deduplicated logistics orders for the dashboard view.
   */
  public async getLogisticsOrders(supplierId: string) {
    // We use the admin client here for supplier access if RLS restricts complex joins
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const repository = this.getRepository(supabaseAdmin);
    return await repository.getLogisticsOrders(supplierId);
  }
}
