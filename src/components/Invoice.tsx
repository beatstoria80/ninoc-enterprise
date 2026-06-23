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

// ─── STYLISH MINIMALIST VERTICAL INVOICE ─────────────────────────────────

export function Invoice({ order }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = typeof (order.shipping_address as any)?.shipping_cost === 'number' 
    ? (order.shipping_address as any).shipping_cost 
    : Math.max(0, order.total_price - subtotal);
  const total = order.total_price;
  const discount = Math.max(0, subtotal + shippingCost - total);

  const orderNumber = order.id.toUpperCase();

  return (
    <div className="w-full max-w-[400px] mx-auto bg-white text-ink border border-ink/5 p-6 flex flex-col gap-6 shadow-sm select-none print:hidden">
      
      {/* GRID 1: TOP SECTION (QR & LOGO) */}
      <div className="flex flex-col items-center text-center pb-6 border-b border-ink/5 gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display font-medium text-2xl italic tracking-tighter uppercase text-rose">ninoc</span>
          <span className="text-[9px] uppercase tracking-[0.3em] text-ink/40">Invoice & Receipt</span>
        </div>

        {/* GIANT QR CODE */}
        <div className="p-3 bg-white border border-ink/5 shadow-sm inline-block rounded-none">
          <QRCodeCanvas
            value={order.id.toUpperCase()}
            size={180}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#141414"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono tracking-widest text-ink/30 uppercase">Nomor Pesanan</span>
          <span className="font-mono font-bold text-sm tracking-wide text-ink">#{orderNumber}</span>
          <span className="text-[9px] text-ink/30 uppercase tracking-[0.2em] mt-1 italic">Unggah invoice ini untuk lacak pesanan otomatis</span>
        </div>
      </div>

      {/* GRID 2: BOTTOM SECTION (DETAILS) */}
      <div className="flex flex-col gap-5 text-xs text-ink/70">
        
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-ink/5">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[9px] uppercase tracking-widest text-ink/30 font-bold">Tanggal</span>
            <span className="font-medium text-ink">{formatDate(order.created_at)}</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[9px] uppercase tracking-widest text-ink/30 font-bold">Status</span>
            <span className={`font-semibold inline-block px-2.5 py-0.5 self-end text-[9px] tracking-wider uppercase ${
              order.payment_status === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}>
              {order.payment_status === 'success' ? 'Lunas' : 'Menunggu'}
            </span>
          </div>
        </div>

        {/* Customer & Shipping info */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-ink/5 text-left">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest text-ink/30 font-bold">Tagihan Ke</span>
            <span className="font-medium text-ink">{order.shipping_address?.name?.toUpperCase() || 'N/A'}</span>
            <span className="text-ink/50 text-[10px] block mt-0.5">{order.shipping_address?.phone || '-'}</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[9px] uppercase tracking-widest text-ink/30 font-bold">Kirim Ke</span>
            <span className="font-medium text-ink break-words leading-tight block">{order.shipping_address?.address?.toUpperCase() || '-'}</span>
            <span className="text-ink/50 text-[9px] block mt-0.5">
              {order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex flex-col gap-3 pb-4 border-b border-ink/5 text-left">
          <span className="text-[9px] uppercase tracking-widest text-ink/30 font-bold">Daftar Pembelian</span>
          <div className="flex flex-col gap-3">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-[11px] leading-snug">
                <div className="flex flex-col max-w-[70%]">
                  <span className="font-medium text-ink">{item.product_name}</span>
                  <span className="text-[10px] text-ink/40 mt-0.5">
                    {item.size ? `Ukuran: ${item.size}` : 'All Size'} • Qty: {item.quantity}
                  </span>
                </div>
                <div className="text-right flex flex-col shrink-0">
                  <span className="font-semibold text-ink">{formatCurrency(item.price_at_purchase * item.quantity)}</span>
                  <span className="text-[9px] text-ink/30 mt-0.5">{formatCurrency(item.price_at_purchase)}/item</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="flex flex-col gap-2 pb-4 border-b border-ink/5">
          <div className="flex justify-between text-[11px]">
            <span className="text-ink/50">Subtotal</span>
            <span className="font-medium text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-ink/50">Biaya Pengiriman</span>
            <span className="font-medium text-ink">{formatCurrency(shippingCost)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-ink/50">Diskon</span>
              <span className="font-medium text-rose">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2.5 mt-1 border-t border-ink/5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink">Total Bayar</span>
            <span className="text-sm font-bold text-rose">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Metadata */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-ink/40 text-left">
          <div className="flex flex-col gap-0.5">
            <span>Metode Pembayaran:</span>
            <span className="font-medium text-ink/60">{order.payment_status === 'success' ? 'Virtual Account' : 'Midtrans'}</span>
          </div>
          {order.midtrans_id && (
            <div className="flex flex-col gap-0.5 text-right items-end">
              <span>Referensi ID:</span>
              <span className="font-mono text-[9px] text-ink/60 break-all">{order.midtrans_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRINTABLE INVOICE (ULTRA MINIMALIST A5/A4) ─────────────────────────────

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
            padding: '12mm',
            position: 'relative',
            fontSize: '11px',
            lineHeight: '1.4',
            gap: '16px'
          }}
        >
          {/* GRID 1: TOP SECTION (QR & LOGO) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '16px', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.5px', textTransform: 'uppercase', color: '#e8527a' }}>ninoc</div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(20,20,20,0.4)' }}>Invoice & Receipt</div>
            </div>

            {/* QR Code Container */}
            <div style={{ padding: '6px', background: 'white', border: '1px solid #f3f4f6', display: 'inline-block' }}>
              <QRCodeCanvas
                value={order.id.toUpperCase()}
                size={140}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#141414"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.4)' }}>Nomor Pesanan</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: '#141414' }}>#{orderNumber}</div>
            </div>
          </div>

          {/* GRID 2: BOTTOM SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Metadata row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <span style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Tanggal</span>
                <span style={{ fontWeight: 500 }}>{formatDate(order.created_at)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Status</span>
                <span style={{
                  fontSize: '8px', fontWeight: 'bold', padding: '2px 6px', background: order.payment_status === 'success' ? '#ecfdf5' : '#fffbeb', color: order.payment_status === 'success' ? '#047857' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {order.payment_status === 'success' ? 'Lunas' : 'Menunggu'}
                </span>
              </div>
            </div>

            {/* Customer & Shipping Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, textAlign: 'left' }}>
                <span style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Tagihan Ke</span>
                <span style={{ fontWeight: 500 }}>{order.shipping_address?.name?.toUpperCase() || 'N/A'}</span>
                <span style={{ color: 'rgba(20,20,20,0.5)', fontSize: '9px' }}>{order.shipping_address?.phone || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, alignItems: 'flex-end', textAlign: 'right' }}>
                <span style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Kirim Ke</span>
                <span style={{ fontWeight: 500 }}>{order.shipping_address?.address?.toUpperCase() || '-'}</span>
                <span style={{ color: 'rgba(20,20,20,0.5)', fontSize: '8px', marginTop: '2px' }}>
                  {order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}
                </span>
              </div>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', textAlign: 'left' }}>
              <span style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(20,20,20,0.3)', fontWeight: 'bold' }}>Daftar Pembelian</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                      <span style={{ fontWeight: 500 }}>{item.product_name}</span>
                      <span style={{ fontSize: '8px', color: 'rgba(20,20,20,0.4)', marginTop: '2px' }}>
                        {item.size ? `Ukuran: ${item.size}` : 'All Size'} • Qty: {item.quantity}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.price_at_purchase * item.quantity)}</span>
                      <span style={{ fontSize: '8px', color: 'rgba(20,20,20,0.3)' }}>{formatCurrency(item.price_at_purchase)}/item</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(20,20,20,0.6)' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(20,20,20,0.6)' }}>
                <span>Biaya Pengiriman</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#e8527a' }}>
                  <span>Diskon</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '6px', marginTop: '2px', borderTop: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bayar</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#e8527a' }}>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Footer details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(20,20,20,0.4)', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>Metode Pembayaran:</span>
                <span style={{ fontWeight: 500, color: 'rgba(20,20,20,0.6)' }}>{order.payment_status === 'success' ? 'Virtual Account' : 'Midtrans'}</span>
              </div>
              {order.midtrans_id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end', textAlign: 'right', maxWidth: '60%' }}>
                  <span>Referensi ID:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '7px', color: 'rgba(20,20,20,0.6)', wordBreak: 'break-all' }}>{order.midtrans_id}</span>
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
