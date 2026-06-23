"use client";
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Order } from '@/components/admin/types';

interface InvoiceProps {
  order: Order;
}

function formatCurrency(amount: number): string {
  return "Rp " + amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── STYLISH MINIMALIST VERTICAL INVOICE (ULTRA COMPACT) ───────────────

export function Invoice({ order }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = typeof (order.shipping_address as any)?.shipping_cost === 'number' 
    ? (order.shipping_address as any).shipping_cost 
    : Math.max(0, order.total_price - subtotal);
  const total = order.total_price;
  const discount = Math.max(0, subtotal + shippingCost - total);

  const orderNumber = order.id.toUpperCase();

  return (
    <div className="w-full max-w-[320px] mx-auto bg-white text-ink border border-ink/5 p-3 flex flex-col gap-2 shadow-sm select-none print:hidden">
      
      {/* GRID 1: TOP SECTION (COMPACT QR & ID ROW) */}
      <div className="flex flex-col items-center text-center pb-1.5 border-b border-ink/5 gap-1.5">
        {/* GIANT QR CODE (1080px Resolution, CSS Scaled down to 130px visually) */}
        <QRCodeCanvas
          value={order.id.toUpperCase()}
          size={1080}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#141414"
          style={{ width: '100%', height: 'auto', maxWidth: '130px', aspectRatio: '1/1' }}
          className="mx-auto block"
        />

        <div className="flex items-baseline justify-center gap-1.5 leading-none pt-0.5">
          <span className="font-display font-medium text-sm italic tracking-tighter uppercase text-rose">ninoc</span>
          <span className="text-ink/15 text-[8px] select-none">|</span>
          <span className="font-mono font-bold text-[10px] tracking-wide text-ink">#{orderNumber}</span>
        </div>
      </div>

      {/* GRID 2: BOTTOM SECTION (DETAILS) */}
      <div className="flex flex-col gap-2 text-[10px] text-ink/70">
        
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-ink/5">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[7.5px] uppercase tracking-widest text-ink/30 font-bold">Tanggal</span>
            <span className="font-medium text-ink">{formatDate(order.created_at)}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-[7.5px] uppercase tracking-widest text-ink/30 font-bold">Status</span>
            <span className={`font-semibold inline-block px-1 py-0.5 self-end text-[7.5px] tracking-wider uppercase ${
              order.payment_status === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}>
              {order.payment_status === 'success' ? 'Lunas' : 'Menunggu'}
            </span>
          </div>
        </div>

        {/* Customer & Shipping info */}
        <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-ink/5 text-left">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7.5px] uppercase tracking-widest text-ink/30 font-bold">Tagihan Ke</span>
            <span className="font-medium text-ink">{order.shipping_address?.name?.toUpperCase() || 'N/A'}</span>
            <span className="text-ink/50 text-[8.5px] block mt-0.5">{order.shipping_address?.phone || '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-[7.5px] uppercase tracking-widest text-ink/30 font-bold">Kirim Ke</span>
            <span className="font-medium text-ink break-words leading-tight block">{order.shipping_address?.address?.toUpperCase() || '-'}</span>
            <span className="text-ink/50 text-[8.5px] block mt-0.5">
              {order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex flex-col gap-1 pb-1.5 border-b border-ink/5 text-left">
          <span className="text-[7.5px] uppercase tracking-widest text-ink/30 font-bold">Daftar Pembelian</span>
          <div className="flex flex-col gap-1.5">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start leading-snug">
                <div className="flex flex-col max-w-[70%]">
                  <span className="font-medium text-ink text-[9.5px]">{item.product_name}</span>
                  <span className="text-[8px] text-ink/40 mt-0.5">
                    {item.size ? `Ukuran: ${item.size}` : 'All Size'} • Qty: {item.quantity}
                  </span>
                </div>
                <div className="text-right flex flex-col shrink-0">
                  <span className="font-semibold text-ink text-[9.5px]">{formatCurrency(item.price_at_purchase * item.quantity)}</span>
                  <span className="text-[8.5px] text-ink/30 mt-0.5">{formatCurrency(item.price_at_purchase)}/item</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="flex flex-col gap-1 pb-1.5 border-b border-ink/5">
          <div className="flex justify-between">
            <span className="text-ink/50">Subtotal</span>
            <span className="font-medium text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Biaya Pengiriman</span>
            <span className="font-medium text-ink">{formatCurrency(shippingCost)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-ink/50">Diskon</span>
              <span className="font-medium text-rose">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1 mt-0.5 border-t border-ink/5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-ink">Total Bayar</span>
            <span className="text-[11px] font-bold text-rose">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Metadata */}
        <div className="grid grid-cols-2 gap-2 text-[8px] text-ink/40 text-left">
          <div className="flex flex-col">
            <span>Metode Pembayaran:</span>
            <span className="font-medium text-ink/60">{order.payment_status === 'success' ? 'Virtual Account' : 'Midtrans'}</span>
          </div>
          {order.midtrans_id && (
            <div className="flex flex-col text-right items-end">
              <span>Referensi ID:</span>
              <span className="font-mono text-[7.5px] text-ink/60 break-all">{order.midtrans_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRINTABLE INVOICE (ULTRA MINIMALIST COMPACT A5/A4) ──────────────────────

export function PrintableInvoice({ order }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = typeof (order.shipping_address as any)?.shipping_cost === 'number' 
    ? (order.shipping_address as any).shipping_cost 
    : Math.max(0, order.total_price - subtotal);
  const discount = Math.max(0, subtotal + shippingCost - order.total_price);
  const total = order.total_price;

  const orderNumber = order.id.toUpperCase();

  return (
    <>
      <div
        id="printable-invoice"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '148mm',
          zIndex: -9999,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '148mm',
            minHeight: '210mm',
            backgroundColor: 'white',
            color: '#141414',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            boxSizing: 'border-box',
            padding: '8mm',
            position: 'relative',
            fontSize: '10px',
            lineHeight: '1.3',
            gap: '10px'
          }}
        >
          {/* GRID 1: TOP SECTION (COMPACT QR & ID ROW) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', gap: '4px' }}>
            {/* GIANT QR CODE (1080px Resolution, CSS Scaled to 110px visually) */}
            <QRCodeCanvas
              value={order.id.toUpperCase()}
              size={1080}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#141414"
              style={{ width: '110px', height: '110px', display: 'block', margin: '0 auto' }}
            />

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', lineHeight: '1' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, fontStyle: 'italic', textTransform: 'uppercase', color: '#e8527a' }}>ninoc</span>
              <span style={{ color: 'rgba(20,20,20,0.15)', fontSize: '8px' }}>|</span>
              <span style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', color: '#141414' }}>#{orderNumber}</span>
            </div>
          </div>

          {/* GRID 2: BOTTOM SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* Metadata row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                <span style={{ fontSize: '6.5px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Tanggal</span>
                <span style={{ fontWeight: 500 }}>{formatDate(order.created_at)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '6.5px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Status</span>
                <span style={{
                  fontSize: '7.5px', fontWeight: 'bold', padding: '1px 4px', background: order.payment_status === 'success' ? '#ecfdf5' : '#fffbeb', color: order.payment_status === 'success' ? '#047857' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {order.payment_status === 'success' ? 'Lunas' : 'Menunggu'}
                </span>
              </div>
            </div>

            {/* Customer & Shipping Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, textAlign: 'left' }}>
                <span style={{ fontSize: '6.5px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Tagihan Ke</span>
                <span style={{ fontWeight: 500 }}>{order.shipping_address?.name?.toUpperCase() || 'N/A'}</span>
                <span style={{ color: 'rgba(20,20,20,0.5)', fontSize: '8px' }}>{order.shipping_address?.phone || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, alignItems: 'flex-end', textAlign: 'right' }}>
                <span style={{ fontSize: '6.5px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Kirim Ke</span>
                <span style={{ fontWeight: 500 }}>{order.shipping_address?.address?.toUpperCase() || '-'}</span>
                <span style={{ color: 'rgba(20,20,20,0.5)', fontSize: '7.5px', marginTop: '1px' }}>
                  {order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}
                </span>
              </div>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', textAlign: 'left' }}>
              <span style={{ fontSize: '6.5px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Daftar Pembelian</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '9px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                      <span style={{ fontWeight: 500 }}>{item.product_name}</span>
                      <span style={{ fontSize: '7.5px', color: 'rgba(20,20,20,0.4)', marginTop: '1px' }}>
                        {item.size ? `Ukuran: ${item.size}` : 'All Size'} • Qty: {item.quantity}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.price_at_purchase * item.quantity)}</span>
                      <span style={{ fontSize: '7.5px', color: 'rgba(20,20,20,0.3)' }}>{formatCurrency(item.price_at_purchase)}/item</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'rgba(20,20,20,0.6)' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'rgba(20,20,20,0.6)' }}>
                <span>Biaya Pengiriman</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#e8527a' }}>
                  <span>Diskon</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '4px', marginTop: '1px', borderTop: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bayar</span>
                <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#e8527a' }}>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Footer details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: 'rgba(20,20,20,0.4)', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span>Metode Pembayaran:</span>
                <span style={{ fontWeight: 500, color: 'rgba(20,20,20,0.6)' }}>{order.payment_status === 'success' ? 'Virtual Account' : 'Midtrans'}</span>
              </div>
              {order.midtrans_id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-end', textAlign: 'right', maxWidth: '60%' }}>
                  <span>Referensi ID:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '6.5px', color: 'rgba(20,20,20,0.6)', wordBreak: 'break-all' }}>{order.midtrans_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: "\n        @media print {\n          @page { size: A5; margin: 0; }\n          body * { visibility: hidden; }\n          #printable-invoice, #printable-invoice * { visibility: visible; }\n          #printable-invoice {\n            position: absolute !important; top: 0 !important; left: 0 !important;\n            width: 148mm !important; height: 210mm !important; z-index: 9999 !important; opacity: 1 !important;\n            pointerEvents: auto !important; background: white !important;\n          }\n        }\n      " }} />
    </>
  );
}
