import { SupabaseClient } from '@supabase/supabase-js';

export class WebhookLogRepository {
  private supabase: SupabaseClient;

  constructor(supabaseAdminClient: SupabaseClient) {
    this.supabase = supabaseAdminClient;
  }

  /**
   * Logs an incoming webhook payload to the tracking_logs table
   */
  async logBiteshipEvent(payload: {
    order_id: string;
    biteship_status: string;
    internal_status: string;
    courier_company?: string | null;
    courier_driver_name?: string | null;
    courier_driver_phone?: string | null;
    courier_link?: string | null;
    raw_payload: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('tracking_logs')
      .insert(payload);

    if (error) {
      console.error(`[WebhookLogRepository] Failed to insert tracking log for order ${payload.order_id}:`, error);
      throw error;
    }
  }
}
