"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    success: { label: 'LUNAS', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' },
    pending: { label: 'MENUNGGU', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200' },
    failed: { label: 'GAGAL', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
    expired: { label: 'KADALUARSA', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
  };
  const cfg = map[status] || map.pending;
  return (
    <span className={`px-2.5 py-1 rounded text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase font-mono border ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ─── RESPONSIVE WEB INVOICE (FOR PC & MOBILE SCREENS) ───────────────────────

export function Invoice({ order }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = 0; // Override if shipping data exists
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  const orderNumber = order.shipping_address?.name
    ? `NCO-${order.id.slice(0, 8).toUpperCase()}`
    : `NCO-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-ink font-sans border border-ink/10 shadow-xl overflow-hidden print:hidden">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row border-b-4 border-ink">
        <div className="flex-1 bg-ink text-white p-6 md:p-10 flex flex-col justify-center">
          <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">NINOC</span>
          <span className="text-[10px] md:text-xs font-bold tracking-[0.4em] opacity-70 mt-1">STUDIO</span>
          <span className="text-[10px] opacity-50 mt-4 tracking-widest">Bandung, Jawa Barat — Indonesia</span>
        </div>
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center items-start md:items-end bg-ink/[0.02]">
          <span className="text-2xl md:text-3xl font-black tracking-widest text-ink">INVOICE</span>
          <span className="text-xs md:text-sm font-bold tracking-[0.1em] font-mono text-ink/60 mt-1">{orderNumber}</span>
          <div className="flex flex-row md:flex-col gap-6 md:gap-2 mt-6">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] md:text-[10px] text-ink/40 tracking-[0.2em] uppercase font-bold">Tanggal</span>
              <span className="text-xs md:text-sm font-bold text-ink">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] md:text-[10px] text-ink/40 tracking-[0.2em] uppercase font-bold">Jam</span>
              <span className="text-xs md:text-sm font-bold text-ink">{formatTime(order.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FROM / TO */}
      <div className="flex flex-col sm:flex-row border-b border-ink/10">
        <div className="flex-1 p-6 md:p-8 border-b sm:border-b-0 sm:border-r border-ink/10">
          <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-ink/40 uppercase">Pengirim / From</span>
          <div className="mt-3 flex flex-col gap-1 text-xs md:text-sm leading-relaxed">
            <span className="font-bold text-ink">NINOC STUDIO</span>
            <span className="text-ink/60">Bandung, Jawa Barat<br/>Indonesia<br/>0812-XXXX-XXXX<br/>hello@ninoc.store</span>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-8">
          <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-ink/40 uppercase">Penerima / To</span>
          <div className="mt-3 flex flex-col gap-1 text-xs md:text-sm leading-relaxed">
            <span className="font-bold text-ink">{order.shipping_address?.name?.toUpperCase() || 'N/A'}</span>
            <span className="text-ink/60">
              {order.shipping_address?.phone || '-'}<br/>
              {order.shipping_address?.address || '-'}<br/>
              {order.shipping_address?.city || ''}, {order.shipping_address?.postal_code || ''}
            </span>
          </div>
        </div>
      </div>

      {/* ORDER ITEMS TABLE */}
      <div className="border-b border-ink/10">
        <div className="hidden sm:flex bg-ink text-white px-6 md:px-8 py-3 text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase">
          <div className="flex-[3]">Deskripsi</div>
          <div className="flex-1 text-center">Qty</div>
          <div className="flex-[1.5] text-right">Harga Satuan</div>
          <div className="flex-[1.5] text-right">Subtotal</div>
        </div>

        <div className="flex flex-col">
          {order.order_items?.map((item, idx) => {
            const itemSubtotal = item.price_at_purchase * item.quantity;
            return (
              <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center px-6 md:px-8 py-4 sm:py-5 gap-3 sm:gap-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-ink/[0.02]'}`}>
                {/* Mobile: Row Layout for Item Details */}
                <div className="flex-[3] flex flex-col">
                  <span className="text-xs md:text-sm font-bold text-ink uppercase tracking-wider">{item.product_name?.toUpperCase() || 'PRODUK'}</span>
                  {item.size && <span className="text-[10px] md:text-xs text-ink/50 mt-1">Ukuran: {item.size}</span>}
                  
                  {/* Mobile Only Details */}
                  <div className="sm:hidden flex items-center justify-between mt-3 text-xs">
                    <span className="font-bold">x{item.quantity}</span>
                    <span className="text-ink/60">{formatCurrency(item.price_at_purchase)}</span>
                  </div>
                </div>
                
                {/* Desktop: Grid Layout for Price/Qty */}
                <div className="hidden sm:block flex-1 text-center text-sm font-bold text-ink">×{item.quantity}</div>
                <div className="hidden sm:block flex-[1.5] text-right text-xs md:text-sm font-semibold text-ink/70">{formatCurrency(item.price_at_purchase)}</div>
                
                {/* Subtotal (Both) */}
                <div className="flex-[1.5] flex justify-between sm:block text-right border-t border-ink/5 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                  <span className="sm:hidden text-xs font-bold text-ink/50 uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold text-ink">{formatCurrency(itemSubtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOTALS */}
      <div className="flex flex-col sm:flex-row border-b border-ink/10">
        <div className="flex-1 p-6 md:p-8 border-b sm:border-b-0 sm:border-r border-ink/10 bg-ink/[0.01]">
          <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-ink/40 uppercase block mb-3">Metode Pembayaran</span>
          <span className="text-xs md:text-sm font-bold text-ink tracking-widest">
            {order.payment_status === 'success' ? 'VIRTUAL ACCOUNT' : 'MIDTRANS'}
          </span>
        </div>
        <div className="w-full sm:w-[320px]">
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-ink/5">
            <span className="text-xs text-ink/60 font-medium">Subtotal</span>
            <span className="text-xs md:text-sm font-bold text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-ink/5">
            <span className="text-xs text-ink/60 font-medium">Ongkos Kirim</span>
            <span className="text-xs md:text-sm font-bold text-ink">{formatCurrency(shippingCost)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-ink/5">
              <span className="text-xs text-emerald-600 font-medium">Diskon</span>
              <span className="text-xs md:text-sm font-bold text-emerald-600">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center p-5 md:p-6 bg-ink text-white">
            <span className="text-xs md:text-sm font-bold tracking-[0.1em] uppercase">Total</span>
            <span className="text-lg md:text-xl font-black tracking-wide">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* PAYMENT INFO + QR */}
      <div className="flex flex-col sm:flex-row border-b border-ink/10 bg-white">
        <div className="flex-[2] p-6 md:p-8 sm:border-r border-ink/10">
          <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-ink/40 uppercase block mb-4">Status & Detail Pembayaran</span>
          <div className="flex flex-col items-start gap-4">
            <PaymentStatusBadge status={order.payment_status} />
            
            {(order.midtrans_id || order.snap_token) && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {order.midtrans_id && (
                  <div>
                    <span className="text-[8px] md:text-[9px] font-bold text-ink/40 uppercase tracking-[0.15em] block mb-1">Midtrans ID</span>
                    <span className="text-xs font-mono font-semibold text-ink/80 break-all">{order.midtrans_id}</span>
                  </div>
                )}
                {order.snap_token && (
                  <div>
                    <span className="text-[8px] md:text-[9px] font-bold text-ink/40 uppercase tracking-[0.15em] block mb-1">Snap Token</span>
                    <span className="text-xs font-mono font-semibold text-ink/80 break-all">{order.snap_token.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center gap-3 bg-ink/[0.02]">
          <div className="bg-white p-2 border border-ink/10 shadow-sm rounded-lg">
            <QRCodeSVG value={order.id.toUpperCase()} size={80} level="M" />
          </div>
          <span className="text-[8px] font-bold tracking-[0.25em] text-ink/40 text-center uppercase">Scan untuk verifikasi</span>
          <span className="text-[10px] font-mono font-bold text-ink/80 tracking-widest">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 md:p-6 bg-ink/[0.03] flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] md:text-[10px] font-bold tracking-[0.15em] text-ink/50">NINOC STUDIO — BANDUNG, JAWA BARAT</span>
          <span className="text-[9px] md:text-[10px] text-ink/40">hello@ninoc.store • www.ninoc.store</span>
        </div>
        <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-ink/30 uppercase">
          INVOICE — {orderNumber}
        </span>
      </div>

    </div>
  );
}

// ─── PRINTABLE INVOICE (HIDDEN ON SCREEN, FIXED A5 SIZE FOR PRINTING) ─────────

export function PrintableInvoice({ order }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = 0;
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  const orderNumber = order.shipping_address?.name
    ? `NCO-${order.id.slice(0, 8).toUpperCase()}`
    : `NCO-${order.id.slice(0, 8).toUpperCase()}`;

  // Kept entirely inline-styled for strict A5 PDF generation
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
            width: '148mm',
            minHeight: '210mm',
            backgroundColor: 'white',
            color: '#111',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            boxSizing: 'border-box',
            padding: '0',
            position: 'relative',
          }}
        >
          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '3px solid #111', minHeight: '80px' }}>
            <div style={{ flex: 1, backgroundColor: '#111', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 16px', gap: '2px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>NINOC</span>
              <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '4px', opacity: 0.7 }}>STUDIO</span>
              <span style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px' }}>Bandung, Jawa Barat — Indonesia</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 16px', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', color: '#111' }}>INVOICE</span>
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', fontFamily: 'monospace', color: '#444' }}>{orderNumber}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginTop: '4px' }}>
                <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px' }}>TANGGAL</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#111' }}>{formatDate(order.created_at)}</span>
                <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', marginTop: '4px' }}>JAM</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#111' }}>{formatTime(order.created_at)}</span>
              </div>
            </div>
          </div>

          {/* FROM / TO */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e5e5' }}>
            <div style={{ flex: 1, padding: '20px 24px', borderRight: '2px solid #e5e5e5' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '2px', color: '#888', textTransform: 'uppercase' }}>PENGIRIM / FROM</span>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#111', letterSpacing: '0.5px' }}>NINOC STUDIO</span>
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>Bandung, Jawa Barat</span>
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>Indonesia</span>
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>0812-XXXX-XXXX</span>
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>hello@ninoc.store</span>
              </div>
            </div>
            <div style={{ flex: 1, padding: '20px 24px' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '2px', color: '#888', textTransform: 'uppercase' }}>PENERIMA / TO</span>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#111', letterSpacing: '0.5px' }}>{order.shipping_address?.name?.toUpperCase() || 'N/A'}</span>
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>{order.shipping_address?.phone || '-'}</span>
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>{order.shipping_address?.address || '-'}</span>
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>{`${order.shipping_address?.city || ''}, ${order.shipping_address?.province || ''} ${order.shipping_address?.postal_code || ''}`}</span>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS TABLE */}
          <div style={{ padding: '0 0 0 0', borderBottom: '2px solid #e5e5e5' }}>
            <div style={{ display: 'flex', backgroundColor: '#111', color: 'white', padding: '10px 24px', gap: '8px' }}>
              <div style={{ flex: 3 }}><span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>DESKRIPSI</span></div>
              <div style={{ flex: 1, textAlign: 'right' }}><span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>QTY</span></div>
              <div style={{ flex: 1.5, textAlign: 'right' }}><span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>HARGA SATUAN</span></div>
              <div style={{ flex: 1.5, textAlign: 'right' }}><span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>SUBTOTAL</span></div>
            </div>
            {order.order_items?.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', padding: '12px 24px', gap: '8px', borderBottom: idx < (order.order_items?.length ?? 0) - 1 ? '1px solid #f0f0f0' : 'none', backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                <div style={{ flex: 3 }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.product_name?.toUpperCase() || 'PRODUK'}</span>
                  {item.size && <span style={{ fontSize: '10px', color: '#888', marginTop: '2px', display: 'block' }}>Ukuran: {item.size}</span>}
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}><span style={{ fontSize: '12px', fontWeight: '800', color: '#111' }}>×{item.quantity}</span></div>
                <div style={{ flex: 1.5, textAlign: 'right' }}><span style={{ fontSize: '12px', fontWeight: '600', color: '#444' }}>{formatCurrency(item.price_at_purchase)}</span></div>
                <div style={{ flex: 1.5, textAlign: 'right' }}><span style={{ fontSize: '12px', fontWeight: '800', color: '#111' }}>{formatCurrency(item.price_at_purchase * item.quantity)}</span></div>
              </div>
            ))}
          </div>

          {/* TOTALS */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e5e5' }}>
            <div style={{ flex: 1, padding: '20px 24px' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '2px', color: '#888', textTransform: 'uppercase' }}>METODE PEMBAYARAN</span>
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#111' }}>{order.payment_status === 'success' ? 'VIRTUAL ACCOUNT' : 'MIDTRANS'}</span>
              </div>
            </div>
            <div style={{ width: '280px', borderLeft: '2px solid #e5e5e5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>Subtotal</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#111' }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>Ongkos Kirim</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#111' }}>{formatCurrency(shippingCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', backgroundColor: '#111', color: 'white' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>TOTAL</span>
                <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '0.5px' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT INFO + QR */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e5e5' }}>
            <div style={{ flex: 1, padding: '20px 24px', borderRight: '2px solid #e5e5e5' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '2px', color: '#888', textTransform: 'uppercase' }}>STATUS PEMBAYARAN</span>
              <div style={{ marginTop: '10px' }}>
                <span style={{ color: order.payment_status === 'success' ? '#16a34a' : '#d97706', backgroundColor: order.payment_status === 'success' ? '#dcfce7' : '#fef3c7', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', fontFamily: 'monospace' }}>
                  {order.payment_status === 'success' ? 'LUNAS' : 'MENUNGGU'}
                </span>
              </div>
              {order.midtrans_id && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>MIDTRANS ID</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: '#111' }}>{order.midtrans_id}</span>
                </div>
              )}
            </div>
            <div style={{ width: '200px', padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <QRCodeSVG value={order.id.toUpperCase()} size={60} level="M" />
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '2px', color: '#888', textAlign: 'center' }}>SCAN UNTUK VERIFIKASI</span>
              <span style={{ fontSize: '10px', fontWeight: '900', fontFamily: 'monospace', color: '#111', letterSpacing: '1px' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa', marginTop: 'auto' }}>
            <div>
              <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block' }}>NINOC STUDIO — BANDUNG, JAWA BARAT</span>
              <span style={{ fontSize: '9px', color: '#aaa' }}>hello@ninoc.store  •  www.ninoc.store</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#888', letterSpacing: '2px' }}>INVOICE — {orderNumber}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A5; margin: 0; }
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 148mm !important; z-index: 9999 !important; opacity: 1 !important;
            pointerEvents: auto !important; background: white !important;
          }
        }
      `}</style>
    </>
  );
}
