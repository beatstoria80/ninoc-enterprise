import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendInvoiceWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailInvoice } from '@/lib/email';
import { notifyAllChannels } from '@/lib/notifications';
import { getAppUrl } from '@/lib/utils';
import { sendPurchaseEventCAPI } from '@/lib/meta-capi';

export class OrderProcessor {
  /**
   * Handles all post-cancellation side effects for an order.
   * - Restocks inventory
   * - Sends cancellation notifications
   */
  static async processCancelledOrder(orderId: string, existingOrder: any) {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Inventory Restock
    const { error: restockError } = await supabaseAdmin.rpc('restock_inventory', { p_order_id: orderId });
    if (restockError) {
      console.error(`[OrderProcessor] Inventory restock failed for Order ${orderId}:`, restockError);
    } else {
      console.log(`[OrderProcessor] Restocked inventory for cancelled Order ${orderId}`);
    }

    // 2. Customer Notification
    if (existingOrder?.user_id) {
      await notifyAllChannels({
        userId: existingOrder.user_id,
        title: 'Pesanan Dibatalkan',
        message: `Pesanan #${existingOrder.order_number || orderId} telah dibatalkan/kadaluarsa. Jika sudah membayar, dana akan diproses refund.`,
        actionLink: `/profile/orders/${orderId}`,
      }).catch(e => console.error('[OrderProcessor] Cancel notify error:', e));
    }
  }

  /**
   * Handles all post-payment side effects for an order.
   * - Consumes voucher quota
   * - Distributes supplier ledgers (virtual inventory & campaign fees)
   * - Distributes affiliate commissions
   * - Sends WhatsApp & Email invoices
   * - Records Midtrans Gateway OPEX
   */
  static async processSuccessfulOrder(orderId: string, existingOrder: any, paymentType: string, grossAmount: number) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
      // A. Atomic Lock / Idempotency Check using wa_invoice_sent as a proxy for "side effects processed"
      const { data: lockOrder, error: lockError } = await supabaseAdmin
        .from('orders')
        .update({ wa_invoice_sent: true, wa_invoice_sent_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('wa_invoice_sent', false)
        .select('id')
        .single();
        
      if (lockError || !lockOrder) {
         console.log(`[OrderProcessor] Side effects for Order ${orderId} already processed (Atomic Lock failed). Skipping.`);
         return;
      }

      // B. Secure Voucher Consumption (Financial integrity)
      const appliedPromo = (existingOrder.shipping_address as any)?.promo_code;
      if (appliedPromo) {
        console.log(`[OrderProcessor] Consuming voucher quota securely for promo: ${appliedPromo}`);
        const { data: voucher } = await supabaseAdmin
          .from('vouchers')
          .select('id, usage_count')
          .eq('code', appliedPromo)
          .single();
        if (voucher) {
          await supabaseAdmin
            .from('vouchers')
            .update({ usage_count: (voucher.usage_count || 0) + 1 })
            .eq('id', voucher.id);
        }
      }

      // B. Fetch order items for supplier ledgers & affiliate commissions
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('id, supplier_id, supplier_hpp, price_at_purchase, quantity, products ( supplier_id, affiliate_eligible )')
        .eq('order_id', orderId);

      // C. Supplier Ledgers Distribution (Double-Entry Virtual Inventory)
      if (orderItems && orderItems.length > 0) {
        const { data: existingLedger } = await supabaseAdmin
          .from('supplier_ledgers')
          .select('id')
          .eq('order_id', orderId)
          .limit(1);

        if (!existingLedger || existingLedger.length === 0) {
          const ledgerEntries: any[] = [];
          
          // 1. Fetch Active Campaigns
          const supplierIds = [...new Set(orderItems.map((i: any) => i.supplier_id || i.products?.supplier_id).filter(Boolean))];
          let activeCampaigns: any[] = [];
          if (supplierIds.length > 0) {
            const { data: campaigns } = await supabaseAdmin
              .from('supplier_campaign_agreements')
              .select('*')
              .in('supplier_id', supplierIds)
              .eq('is_active', true);
            if (campaigns) activeCampaigns = campaigns;
          }

          orderItems.forEach((item: any) => {
            const sId = item.supplier_id || item.products?.supplier_id;
            const hpp = Number(item.supplier_hpp);
            if (sId && hpp > 0) {
              // Revenue Entry (Total HPP)
              ledgerEntries.push({
                supplier_id: sId,
                order_id: orderId,
                order_item_id: item.id,
                transaction_type: 'SALES_REVENUE',
                amount: hpp * item.quantity,
                description: `Virtual Inventory Revenue (Order ${orderId})`,
                status: 'pending'
              });

              // Check if this supplier has an active campaign deduction
              const campaign = activeCampaigns.find(c => c.supplier_id === sId);
              if (campaign) {
                let deduction = 0;
                if (Number(campaign.cogs_deduction_amount) > 0) {
                  deduction = Number(campaign.cogs_deduction_amount) * item.quantity;
                } else if (Number(campaign.cogs_deduction_percentage) > 0) {
                  deduction = (hpp * (Number(campaign.cogs_deduction_percentage) / 100)) * item.quantity;
                }

                if (deduction > 0) {
                  ledgerEntries.push({
                    supplier_id: sId,
                    order_id: orderId,
                    order_item_id: item.id,
                    transaction_type: 'CAMPAIGN_FEE',
                    amount: deduction,
                    description: `Campaign Deduction: ${campaign.campaign_name}`,
                    status: 'pending'
                  });
                }
              }
            }
          });

          if (ledgerEntries.length > 0) {
            await supabaseAdmin.from('supplier_ledgers').insert(ledgerEntries);
            console.log(`[OrderProcessor] Created ${ledgerEntries.length} virtual inventory ledger entries for Order ${orderId}`);
          }
        }
      }

      // D. Affiliate Commission Calculation (Idempotent check)
      if (existingOrder.affiliate_id && orderItems && orderItems.length > 0) {
        const { data: existingComm } = await supabaseAdmin
          .from('affiliate_commissions')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!existingComm) {
          const { data: affiliate } = await supabaseAdmin
            .from('affiliates')
            .select('commission_rate')
            .eq('id', existingOrder.affiliate_id)
            .single();

          if (affiliate) {
            let eligibleTotal = 0;
            orderItems.forEach((item: any) => {
              if (item.products && item.products.affiliate_eligible === true) {
                eligibleTotal += (Number(item.price_at_purchase) * Number(item.quantity));
              }
            });

            if (eligibleTotal > 0) {
              const commAmount = (eligibleTotal * Number(affiliate.commission_rate)) / 100;
              await supabaseAdmin.from('affiliate_commissions').insert({
                affiliate_id: existingOrder.affiliate_id,
                order_id: orderId,
                amount: commAmount,
                status: 'pending'
              });
              console.log(`[OrderProcessor] Created affiliate commission Rp ${commAmount} for Order ${orderId}`);
            }
          }
        }
      }

      // E. Customer Notifications (WhatsApp Invoice, Email & Push)
      const shippingAddress = existingOrder.shipping_address as Record<string, string> | null;
      const phone = shippingAddress?.phone || '';
      const customerName = shippingAddress?.name || 'Pelanggan';
      const formattedPhone = formatPhoneNumber(phone);
      const customerEmail = shippingAddress?.email;

      if (formattedPhone) {
        const formattedPrice = `Rp ${Number(existingOrder.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        const appUrl = getAppUrl();
        const trackId = existingOrder.order_number || orderId;
        const paymentUrl = `${appUrl}/track?order_number=${trackId}&phone=${encodeURIComponent(formattedPhone)}`;

        sendInvoiceWA({
          phone: formattedPhone,
          customer_name: customerName,
          order_id: orderId,
          total_price: formattedPrice,
          payment_url: paymentUrl,
        }).catch(err => console.error('[OrderProcessor] WA Invoice Error:', err));
      }

      if (customerEmail) {
        sendEmailInvoice(existingOrder, customerEmail).catch(err => console.error('[OrderProcessor] Email Invoice Error:', err));
      }

      if (existingOrder.user_id) {
        notifyAllChannels({
          userId: existingOrder.user_id,
          title: 'Pembayaran Berhasil!',
          message: `Pesanan #${existingOrder.order_number || orderId} senilai Rp ${Number(existingOrder.total_price).toLocaleString('id-ID')} telah dikonfirmasi.`,
          actionLink: `/profile/orders/${orderId}`,
        }).catch(err => console.error('[OrderProcessor] Push Notification Error:', err));
      }

      // Meta Conversions API (CAPI) Integration
      sendPurchaseEventCAPI({
        orderId: orderId,
        value: Number(existingOrder.total_price),
        currency: 'IDR',
        email: customerEmail,
        phone: formattedPhone || phone,
        items: Array.isArray(existingOrder.items) 
          ? existingOrder.items.map((item: any) => ({
              id: item.product_id || 'UNKNOWN',
              quantity: item.quantity || 1,
              item_price: item.price || 0,
            }))
          : [],
      });

      // F. Record Midtrans Gateway Fee as OPEX (NINOC Absorbs Platform Fee)
      let midtransFee = 0;

      if (paymentType === 'qris' || paymentType === 'gopay') {
        midtransFee = grossAmount * 0.007; // 0.7%
      } else if (paymentType === 'bank_transfer' || paymentType === 'echannel' || paymentType === 'cstore') {
        midtransFee = 4440; // Flat Rp 4000 + 11% PPN
      } else if (paymentType === 'credit_card') {
        midtransFee = (grossAmount * 0.029) + 2000;
      } else {
        midtransFee = 4440; // Fallback
      }

      if (midtransFee > 0) {
        const roundedFee = Math.round(midtransFee);
        const { error: opexError } = await supabaseAdmin.from('operational_expenses').insert({
          category: 'payment_gateway',
          description: `Fee Midtrans Order #${existingOrder.order_number || orderId} (${paymentType.toUpperCase()})`,
          amount: roundedFee,
          expense_date: new Date().toISOString().slice(0, 10),
          created_by: 'system@ninoc.store'
        });
        if (opexError) {
          console.error(`[OrderProcessor] Failed to insert OPEX for Order ${orderId}:`, opexError);
        } else {
          console.log(`[OrderProcessor] Logged Midtrans OPEX Rp ${roundedFee} for Order ${orderId}`);
        }
      }
    } catch (err) {
      console.error(`[OrderProcessor] Unhandled error processing successful Order ${orderId}:`, err);
    }
  }
}
