import { Order, Product } from '@/components/admin/types';
import { supabase } from '@/lib/supabase';

export const printShippingLabel = async (
  order: Order,
  adminUser: { id: string; email?: string; role?: string } | null,
  products: Product[],
  setSelectedOrder: (order: Order) => void,
  isAuthorizedReprint: boolean
) => {
  // Fraud Prevention: Log Print Event
  const newCount = (order.print_count || 0) + 1;
  const printedBy = adminUser?.email || 'Unknown';
  const reasonText = isAuthorizedReprint ? ` - REASON: Authorized Reprint` : '';
  const newPrintedBy = isAuthorizedReprint ? `${printedBy}${reasonText}` : printedBy;
  
  try {
    await supabase
      .from('orders')
      .update({ 
        print_count: newCount, 
        last_printed_by: newPrintedBy,
        last_printed_at: new Date().toISOString()
      })
      .eq('id', order.id);
      
    // Optimistic update
    setSelectedOrder({ ...order, print_count: newCount, last_printed_by: newPrintedBy });
  } catch (e) {
    console.error('Failed to update print count', e);
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Jendela cetak diblokir oleh browser. Mohon izinkan pop-up (Pop-up Blocker) untuk website ini lalu coba lagi.');
    return;
  }
  
  const items = order?.order_items || [];
  const enrichedItems = items.map((item: any) => {
    const product = products.find((p: any) => p.id === item.product_id);
    const variant = product?.variants?.find((v: any) => v.id === item.variant_id);
    return { 
      ...item, 
      sku: variant?.sku || item.sku || 'N/A',
      color: variant?.color || item.color,
      size: variant?.size || item.size
    };
  });
  const totalItems = items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) || 0;
  
  const watermarkHtml = newCount > 1 ? `
    <div style="position: absolute; top: 50px; left: 50%; transform: translateX(-50%) rotate(-30deg); font-size: 32px; font-weight: 900; color: rgba(0,0,0,0.1); border: 4px solid rgba(0,0,0,0.1); padding: 5px 10px; text-transform: uppercase; letter-spacing: 5px; z-index: 10; pointer-events: none; white-space: nowrap;">
      ${isAuthorizedReprint ? 'AUTHORIZED REPRINT' : 'REPRINT'}
      <div style="font-size: 10px; text-align: center; margin-top: 5px; letter-spacing: 1px;">
        OLEH: ${printedBy}
      </div>
    </div>
  ` : '';

  const maskPhone = (phone: string | undefined) => {
    if (!phone || phone.length < 8) return phone || '-';
    return phone.slice(0, 4) + '-****-' + phone.slice(-4);
  };

  const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label Pengiriman - NINOC Archive</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap');
            
            body { 
              font-family: 'Courier Prime', monospace; 
              margin: 0; 
              padding: 0; 
              background: white; 
              color: #000;
            }
            
            /* Thermal Label Standard Size */
            .label { 
              background: white; 
              width: 100%; 
              height: 100%;
              padding: 0;
              margin: 0; 
              box-sizing: border-box;
              position: relative;
            }

            .label-inner {
              border: 2px solid #000;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }

            /* Header Section */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 4mm;
              border-bottom: 2px solid #000;
            }
            .brand {
              font-family: 'Inter', sans-serif;
              font-size: 14px;
              font-weight: 900;
              font-style: italic;
              letter-spacing: -0.5px;
            }
            .brand span {
              font-size: 8px;
              font-weight: 600;
              margin-left: 4px;
              font-style: normal;
              letter-spacing: 1px;
            }
            .courier-box {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            .courier-badge {
              background: #000;
              color: #fff;
              font-family: 'Inter', sans-serif;
              font-weight: 800;
              font-size: 10px;
              padding: 2px 4px;
              letter-spacing: 0.5px;
            }

            /* Barcode Section */
            .barcode-section {
              padding: 4mm;
              text-align: center;
              border-bottom: 2px solid #000;
            }
            .barcode-section img {
              width: 100%;
              height: 50px;
              display: block;
              margin: 0 auto;
            }
            .awb-text {
              font-family: 'Courier Prime', monospace;
              font-weight: 700;
              font-size: 14px;
              margin-top: 4px;
              letter-spacing: 2px;
            }

            /* Address Grid */
            .address-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              border-bottom: 2px solid #000;
            }
            .address-box {
              padding: 4mm;
            }
            .address-box.left {
              border-right: 2px solid #000;
            }
            .box-title {
              font-family: 'Inter', sans-serif;
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 4px;
              text-decoration: underline;
            }
            .person-name {
              font-weight: 700;
              font-size: 12px;
              margin-bottom: 2px;
              font-family: 'Inter', sans-serif;
              text-transform: uppercase;
            }
            .person-phone {
              font-size: 10px;
              margin-bottom: 6px;
            }
            .person-address {
              font-size: 9px;
              line-height: 1.6;
              text-transform: uppercase;
            }

            /* Content Grid */
            .content-grid {
              display: grid;
              grid-template-columns: 2fr 1fr;
              border-bottom: 2px solid #000;
              flex: 1;
            }
            .content-box {
              padding: 4mm;
            }
            .content-box.left {
              border-right: 2px solid #000;
            }
            .item-line {
              font-size: 10px;
              line-height: 1.4;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            
            .order-id-box {
              text-align: center;
              padding-top: 4mm;
            }
            .order-id-val {
              font-family: 'Inter', sans-serif;
              font-size: 12px;
              font-weight: 800;
              margin-top: 4px;
            }
            .qty-val {
              font-size: 9px;
              margin-top: 8px;
              display: flex;
              justify-content: space-between;
              padding: 0 4px;
            }

            /* Footer */
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 2mm 4mm;
              font-size: 8px;
            }
            .fragile-badge {
              background: #000;
              color: #fff;
              font-family: 'Inter', sans-serif;
              font-weight: 800;
              padding: 2px 6px;
              font-size: 10px;
              letter-spacing: 1px;
            }

            @media print {
              @page { margin: 0; size: 100mm 150mm; }
            }
          </style>
        </head>
        <body>
            <div class="label">
              ${watermarkHtml}
              <div class="label-inner">
                
                <div class="header">
                  <div class="brand">NINOC <span>ARCHIVE</span></div>
                  <div class="courier-box">
                    <div class="courier-badge">${(order.courier || 'STD').toUpperCase().slice(0, 5)}</div>
                  </div>
                </div>

                <div class="barcode-section">
                  <svg class="barcode"
                    jsbarcode-format="CODE128"
                    jsbarcode-value="${order.tracking_id || 'NNC' + order.id.toUpperCase()}"
                    jsbarcode-textmargin="0"
                    jsbarcode-fontoptions="bold"
                    jsbarcode-height="50"
                    jsbarcode-displayvalue="false"
                    jsbarcode-width="2"
                    jsbarcode-margin="0">
                  </svg>
                  <div class="awb-text">${order.tracking_id || 'NNC' + order.id.toUpperCase()}</div>
                </div>

                <div class="address-grid">
                  <div class="address-box left">
                    <div class="box-title">PENERIMA / TO</div>
                    <div class="person-name">${order.shipping_address?.name || 'GUEST'}</div>
                    <div class="person-phone">${maskPhone(order.shipping_address?.phone)}</div>
                    ${order.shipping_address?.address_type ? `<div style="display:inline-block; border:1px solid black; padding:1px 4px; font-size:8px; font-weight:bold; margin-top:2px; margin-bottom:2px;">${order.shipping_address.address_type === 'Home' ? 'Home / Rumah' : 'Office / Kantor'}</div>` : ''}
                    <div class="person-address">
                      ${order.shipping_address?.address || '-'}<br/>
                      ${order.shipping_address?.address?.toUpperCase().includes((order.shipping_address?.city || '').toUpperCase()) ? '' : (order.shipping_address?.city || '-')}
                    </div>
                  </div>
                  <div class="address-box">
                    <div class="box-title">PENGIRIM / FROM</div>
                    <div class="person-name">NINOC STUDIO</div>
                    <div class="person-phone">0821-1983-774</div>
                    <div class="person-address">
                      Kota Bandung<br/>
                      Jawa Barat<br/>
                      40292
                    </div>
                  </div>
                </div>

                <div class="content-grid">
                  <div class="content-box left">
                    <div class="box-title">ISI PAKET / CONTENTS</div>
                    ${enrichedItems?.map((i: any) => `
                      <div class="item-line">${i.product_name} ${[i.sku, i.color, i.size].filter(Boolean).length > 0 ? `(${[i.sku, i.color, i.size].filter(Boolean).join(' / ')})` : ''} x${i.quantity}</div>
                    `).join('') || '<div class="item-line">No items found</div>'}
                  </div>
                  <div class="content-box">
                    <div class="order-id-box">
                      <div class="box-title" style="text-decoration:none;">ORDER ID</div>
                      <div class="order-id-val">#${order.id.toUpperCase()}</div>
                    </div>
                    <div class="qty-val">
                      <span>Qty: ${totalItems}</span>
                      <span>~${totalItems * 100}g</span>
                    </div>
                  </div>
                </div>

                <div class="footer">
                  <div>${new Date(order.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
                  <div>NINOC ARCHIVE - BANDUNG, INDONESIA</div>
                  <div class="fragile-badge">FRAGILE</div>
                </div>

              </div>
            </div>
          
          <script>
            JsBarcode(".barcode").init();
            window.onload = () => { setTimeout(() => { window.print(); }, 800); }
          </script>
        </body>
      </html>
    `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
