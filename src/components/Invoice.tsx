"use client";

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Order } from '@/components/admin/types';

interface InvoiceProps {
  order: Order;
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    success: { label: 'LUNAS', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    pending: { label: 'MENUNGGU', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    failed: { label: 'GAGAL', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    expired: { label: 'KADALUARSA', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
  };
  const cfg = map[status] || map.pending;
  return (
    <span className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold tracking-widest uppercase border ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ─── RESPONSIVE WEB INVOICE (FOR PC & MOBILE SCREENS) ───────────────────────

export function Invoice({ order }: InvoiceProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = typeof (order.shipping_address as any)?.shipping_cost === 'number' 
    ? (order.shipping_address as any).shipping_cost 
    : Math.max(0, order.total_price - subtotal);
  const total = order.total_price;
  const discount = Math.max(0, subtotal + shippingCost - total);

  const orderNumber = order.shipping_address?.name
    ? `NCO-${order.id.toUpperCase()}`
    : `NCO-${order.id.toUpperCase()}`;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-gray-800 font-sans border border-gray-200 shadow-sm rounded-lg overflow-hidden print:hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start p-6 md:p-10 border-b border-gray-100">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-black text-xl">
              N
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">NINOC STUDIO</h1>
              <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">Bandung, Indonesia</p>
            </div>
          </div>
          <div className="mt-6 text-xs md:text-sm text-gray-500 leading-relaxed max-w-xs">
            Jl. Contoh Alamat No. 123, Kecamatan, Kota Bandung<br/>
            Jawa Barat 40292<br/>
            Phone: 0821-1983-774<br/>
            Email: hello@ninoc.store
          </div>
        </div>
        
        <div className="mt-8 md:mt-0 flex flex-col items-start md:items-end w-full md:w-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">INVOICE</h2>
          <div className="mt-4 w-full md:w-auto">
            <div className="flex justify-between md:justify-end md:gap-8 text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium w-24">Nomor</span>
              <span className="font-bold text-gray-900">{orderNumber}</span>
            </div>
            <div className="flex justify-between md:justify-end md:gap-8 text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium w-24">Tanggal</span>
              <span className="font-medium text-gray-900">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between md:justify-end md:gap-8 text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium w-24">Referensi</span>
              <span className="font-medium text-gray-900">#{order.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BILL TO / SHIP TO */}
      <div className="flex flex-col md:flex-row p-6 md:p-10 border-b border-gray-100 bg-gray-50/50">
        <div className="flex-1 mb-6 md:mb-0">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ditagihkan Kepada</h3>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p className="font-bold text-gray-900 text-base">{order.shipping_address?.name?.toUpperCase() || 'N/A'}</p>
            <p className="mt-1">{order.shipping_address?.phone || '-'}</p>
            <p className="mt-1 text-gray-500">Email: -</p>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dikirim Ke</h3>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p className="font-medium text-gray-900">{order.shipping_address?.address?.toUpperCase() || '-'}</p>
            <p className="mt-1 text-gray-500">
              {order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}<br/>
              {order.shipping_address?.postal_code || ''}
            </p>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="p-6 md:p-10">
        {/* Table Header (Desktop only) */}
        <div className="hidden md:flex border-b border-gray-300 pb-3 mb-4">
          <div className="flex-[3] text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi Produk</div>
          <div className="flex-1 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Harga Satuan</div>
          <div className="flex-1 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Qty</div>
          <div className="flex-1 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Subtotal</div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col gap-4 md:gap-0">
          {order.order_items?.map((item, idx) => {
            const itemSubtotal = item.price_at_purchase * item.quantity;
            return (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center py-4 border-b border-gray-100 last:border-0">
                
                {/* Mobile: Top Row (Name & Qty) */}
                <div className="flex justify-between md:hidden mb-2">
                  <span className="text-sm font-bold text-gray-900">{item.product_name || 'PRODUK'}</span>
                  <span className="text-sm font-bold text-gray-900">x{item.quantity}</span>
                </div>

                {/* Desktop: Product Column */}
                <div className="flex-[3] flex flex-col">
                  <span className="hidden md:block text-sm font-bold text-gray-900">{item.product_name || 'PRODUK'}</span>
                  {item.size && <span className="text-xs text-gray-500 mt-1">Ukuran: {item.size}</span>}
                </div>
                
                {/* Mobile: Price row */}
                <div className="flex justify-between items-center md:hidden mt-2 text-sm text-gray-600">
                  <span>Harga: {formatCurrency(item.price_at_purchase)}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(itemSubtotal)}</span>
                </div>

                {/* Desktop: Columns */}
                <div className="hidden md:block flex-1 text-center text-sm text-gray-700">{formatCurrency(item.price_at_purchase)}</div>
                <div className="hidden md:block flex-1 text-center text-sm font-medium text-gray-900">{item.quantity}</div>
                <div className="hidden md:block flex-1 text-right text-sm font-bold text-gray-900">{formatCurrency(itemSubtotal)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOTALS & PAYMENT INFO */}
      <div className="flex flex-col-reverse md:flex-row bg-gray-50/50 border-t border-gray-100 p-6 md:p-10">
        
        {/* Payment Notes */}
        <div className="flex-1 mt-8 md:mt-0 pr-0 md:pr-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informasi Pembayaran</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <PaymentStatusBadge status={order.payment_status} />
              <span className="text-sm font-medium text-gray-600">{order.payment_status === 'success' ? 'VIRTUAL ACCOUNT' : 'MIDTRANS'}</span>
            </div>
            
            {order.midtrans_id && (
              <div className="mb-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Midtrans ID</span>
                <p className="text-xs font-mono text-gray-700">{order.midtrans_id}</p>
              </div>
            )}
            
            <div className="mt-4 flex items-center gap-3">
              <QRCodeCanvas value={order.id.toUpperCase()} size={50} level="M" />
              <div className="text-xs text-gray-500">
                <p>Scan QR code ini untuk</p>
                <p>verifikasi keaslian invoice.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Totals */}
        <div className="w-full md:w-80">
          <div className="flex justify-between items-center py-2 text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 text-sm text-gray-600">
            <span>Ongkos Kirim</span>
            <span className="font-medium text-gray-900">{formatCurrency(shippingCost)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center py-2 text-sm text-emerald-600">
              <span>Diskon</span>
              <span className="font-medium">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-300">
            <span className="text-base font-bold text-gray-900 uppercase tracking-widest">Total Bayar</span>
            <span className="text-2xl font-black text-gray-900">{formatCurrency(total)}</span>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="bg-gray-900 text-white p-6 text-center text-xs text-gray-400">
        <p>Terima kasih telah berbelanja di NINOC STUDIO. Jika Anda memiliki pertanyaan mengenai invoice ini, silakan hubungi kami.</p>
      </div>

    </div>
  );
}

// ─── PRINTABLE INVOICE (FIXED A4/A5 SIZE FOR PRINTING) ─────────

export function PrintableInvoice({ order }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = typeof (order.shipping_address as any)?.shipping_cost === 'number' 
    ? (order.shipping_address as any).shipping_cost 
    : Math.max(0, order.total_price - subtotal);
  const discount = Math.max(0, subtotal + shippingCost - order.total_price);
  const total = order.total_price;

  const orderNumber = order.shipping_address?.name
    ? `NCO-${order.id.toUpperCase()}`
    : `NCO-${order.id.toUpperCase()}`;

  return (
    <>
      <div
        id="printable-invoice"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '210mm',
          zIndex: -9999,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '210mm',
            minHeight: '297mm', // A4
            backgroundColor: 'white',
            color: '#1f2937', // gray-800
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            boxSizing: 'border-box',
            padding: '20mm',
            position: 'relative',
          }}
        >
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#111827', letterSpacing: '-1px' }}>NINOC STUDIO</h1>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px' }}>Bandung, Indonesia</p>
              <div style={{ marginTop: '16px', fontSize: '11px', color: '#4b5563', lineHeight: '1.6' }}>
                Jl. Contoh Alamat No. 123, Kecamatan<br/>
                Kota Bandung, Jawa Barat 40292<br/>
                Phone: 0821-1983-774<br/>
                Email: hello@ninoc.store
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: '#111827', letterSpacing: '-1px' }}>INVOICE</h2>
              <table style={{ marginTop: '16px', borderCollapse: 'collapse', width: '200px', marginLeft: 'auto' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#6b7280', textAlign: 'left' }}>Nomor</td>
                    <td style={{ padding: '4px 0', fontSize: '12px', fontWeight: 700, color: '#111827', textAlign: 'right' }}>{orderNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#6b7280', textAlign: 'left', borderTop: '1px solid #f3f4f6' }}>Tanggal</td>
                    <td style={{ padding: '4px 0', fontSize: '12px', fontWeight: 500, color: '#111827', textAlign: 'right', borderTop: '1px solid #f3f4f6' }}>{formatDate(order.created_at)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#6b7280', textAlign: 'left', borderTop: '1px solid #f3f4f6' }}>Referensi</td>
                    <td style={{ padding: '4px 0', fontSize: '12px', fontWeight: 500, color: '#111827', textAlign: 'right', borderTop: '1px solid #f3f4f6' }}>#{order.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BILL TO / SHIP TO */}
          <div style={{ display: 'flex', gap: '40px', marginBottom: '30px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Ditagihkan Kepada</h3>
              <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
                <strong style={{ color: '#111827', fontSize: '14px' }}>{order.shipping_address?.name?.toUpperCase() || 'N/A'}</strong><br/>
                {order.shipping_address?.phone || '-'}<br/>
                Email: -
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Dikirim Ke</h3>
              <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
                <strong style={{ color: '#111827' }}>{order.shipping_address?.address?.toUpperCase() || '-'}</strong><br/>
                {order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}<br/>
                {order.shipping_address?.postal_code || ''}
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 0', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Deskripsi Produk</th>
                <th style={{ padding: '10px 0', textAlign: 'center', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', width: '120px' }}>Harga Satuan</th>
                <th style={{ padding: '10px 0', textAlign: 'center', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', width: '60px' }}>Qty</th>
                <th style={{ padding: '10px 0', textAlign: 'right', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', width: '120px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{item.product_name || 'PRODUK'}</div>
                    {item.size && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Ukuran: {item.size}</div>}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px', color: '#4b5563' }}>{formatCurrency(item.price_at_purchase)}</td>
                  <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#111827' }}>{item.quantity}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatCurrency(item.price_at_purchase * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS & PAYMENT */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 'auto' }}>
            <div style={{ width: '250px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>Status Pembayaran</span>
              <div style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', display: 'inline-block', borderRadius: '4px', backgroundColor: order.payment_status === 'success' ? '#dcfce7' : '#fef3c7', color: order.payment_status === 'success' ? '#16a34a' : '#d97706', marginBottom: '12px' }}>
                {order.payment_status === 'success' ? 'LUNAS' : 'MENUNGGU'}
              </div>
              <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '16px' }}>Metode: {order.payment_status === 'success' ? 'Virtual Account' : 'Midtrans'}</div>
              <QRCodeCanvas value={order.id.toUpperCase()} size={60} level="M" />
            </div>

            <div style={{ width: '300px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '13px', color: '#6b7280' }}>Subtotal</td>
                    <td style={{ padding: '8px 0', fontSize: '13px', fontWeight: 600, color: '#111827', textAlign: 'right' }}>{formatCurrency(subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '13px', color: '#6b7280' }}>Ongkos Kirim</td>
                    <td style={{ padding: '8px 0', fontSize: '13px', fontWeight: 600, color: '#111827', textAlign: 'right' }}>{formatCurrency(shippingCost)}</td>
                  </tr>
                  {discount > 0 && (
                    <tr>
                      <td style={{ padding: '8px 0', fontSize: '13px', color: '#059669' }}>Diskon</td>
                      <td style={{ padding: '8px 0', fontSize: '13px', fontWeight: 600, color: '#059669', textAlign: 'right' }}>-{formatCurrency(discount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '16px 0 0', fontSize: '14px', fontWeight: 800, color: '#111827', borderTop: '2px solid #e5e7eb', textTransform: 'uppercase' }}>Total Bayar</td>
                    <td style={{ padding: '16px 0 0', fontSize: '20px', fontWeight: 900, color: '#111827', textAlign: 'right', borderTop: '2px solid #e5e7eb' }}>{formatCurrency(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '16px', fontSize: '10px', color: '#9ca3af' }}>
            Terima kasih telah berbelanja di NINOC STUDIO. Dokumen ini adalah invoice yang sah.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: absolute !important; top: 0 !important; left: 0 !important;
            width: 210mm !important; height: 297mm !important; z-index: 9999 !important; opacity: 1 !important;
            pointerEvents: auto !important; background: white !important;
          }
        }
      `}</style>
    </>
  );
}
