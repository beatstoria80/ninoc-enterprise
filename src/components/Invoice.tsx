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

// ─── RESPONSIVE WEB INVOICE (ULTRA MINIMALIST) ──────────────────────────────

export function Invoice({ order }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = typeof (order.shipping_address as any)?.shipping_cost === 'number' 
    ? (order.shipping_address as any).shipping_cost 
    : Math.max(0, order.total_price - subtotal);
  const total = order.total_price;
  const discount = Math.max(0, subtotal + shippingCost - total);

  const orderNumber = "NCO-" + order.id.toUpperCase();

  return (
    <div className="w-full max-w-3xl mx-auto bg-white text-gray-900 font-sans border border-gray-100 shadow-sm print:hidden text-[13px] leading-relaxed">
      
      {/* HEADER SECTION */}
      <div className="flex flex-row justify-between items-start p-5 md:p-6 border-b border-gray-100">
        <div className="flex flex-col">
          <span className="font-medium tracking-tight text-base">NINOC STUDIO</span>
          <span className="text-gray-500 text-[11px] mt-0.5">Bandung, Indonesia</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-gray-500 text-[11px] uppercase tracking-wider">Invoice</span>
          <span className="font-medium text-[13px]">{orderNumber}</span>
          <span className="text-gray-500 text-[11px] mt-1">{formatDate(order.created_at)}</span>
        </div>
      </div>

      {/* CUSTOMER INFO */}
      <div className="flex flex-row justify-between p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 gap-4">
        <div className="flex-1">
          <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1.5">Tagihan Ke</div>
          <div className="text-[12px]">
            <span className="font-medium block">{order.shipping_address?.name?.toUpperCase() || 'N/A'}</span>
            <span className="text-gray-500 block">{order.shipping_address?.phone || '-'}</span>
          </div>
        </div>
        <div className="flex-1 text-right md:text-left">
          <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1.5">Kirim Ke</div>
          <div className="text-[12px] text-gray-500">
            <span className="block text-gray-900">{order.shipping_address?.address?.toUpperCase() || '-'}</span>
            <span className="block">{order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}</span>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE (Ultra Compact) */}
      <div className="p-5 md:p-6">
        {/* Header - Hidden on mobile for extreme compactness, shown on md */}
        <div className="hidden md:flex border-b border-gray-100 pb-2 mb-3 text-[10px] text-gray-400 uppercase tracking-widest">
          <div className="flex-[4]">Item</div>
          <div className="flex-1 text-right">Harga</div>
          <div className="flex-1 text-right">Qty</div>
          <div className="flex-1 text-right">Total</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-3 md:gap-0">
          {order.order_items?.map((item, idx) => {
            const itemSubtotal = item.price_at_purchase * item.quantity;
            return (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center py-2 md:py-3 border-b border-gray-50 last:border-0">
                {/* Mobile View: 2 lines */}
                <div className="md:hidden flex justify-between items-start w-full">
                  <div className="flex flex-col pr-4">
                    <span className="font-medium text-[12px] text-gray-900">{item.product_name}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5">{item.size ? "Ukuran: " + item.size : ""} ({item.quantity}x)</span>
                  </div>
                  <span className="font-medium text-[12px] text-gray-900">{formatCurrency(itemSubtotal)}</span>
                </div>

                {/* Desktop View: Grid */}
                <div className="hidden md:block flex-[4]">
                  <span className="font-medium text-[12px] text-gray-900">{item.product_name}</span>
                  {item.size && <span className="text-[11px] text-gray-500 ml-2">({item.size})</span>}
                </div>
                <div className="hidden md:block flex-1 text-right text-[12px] text-gray-500">{formatCurrency(item.price_at_purchase)}</div>
                <div className="hidden md:block flex-1 text-right text-[12px] text-gray-500">{item.quantity}</div>
                <div className="hidden md:block flex-1 text-right text-[12px] font-medium text-gray-900">{formatCurrency(itemSubtotal)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="flex flex-col-reverse md:flex-row border-t border-gray-100">
        
        {/* Payment Info */}
        <div className="flex-1 p-5 md:p-6 border-t md:border-t-0 border-gray-100 flex items-end">
          <div className="w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Status</span>
              <span className={"text-[11px] font-medium px-2 py-0.5 rounded " + (order.payment_status === 'success' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                {order.payment_status === 'success' ? 'LUNAS' : 'MENUNGGU'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500 mb-1">
              <span>Metode</span>
              <span className="text-gray-900">{order.payment_status === 'success' ? 'Virtual Account' : 'Midtrans'}</span>
            </div>
            {order.midtrans_id && (
              <div className="flex justify-between items-center text-[11px] text-gray-500">
                <span>Ref</span>
                <span className="text-gray-900 font-mono text-[10px]">{order.midtrans_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="w-full md:w-64 p-5 md:p-6 bg-gray-50/30">
          <div className="flex justify-between items-center py-1 text-[12px] text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center py-1 text-[12px] text-gray-500">
            <span>Ongkir</span>
            <span>{formatCurrency(shippingCost)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center py-1 text-[12px] text-gray-500">
              <span>Diskon</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
            <span className="text-[12px] font-medium text-gray-900">Total</span>
            <span className="text-[14px] font-medium text-gray-900">{formatCurrency(total)}</span>
          </div>
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

  const orderNumber = "NCO-" + order.id.toUpperCase();

  return (
    <>
      <div
        id="printable-invoice"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '148mm', // A5 width
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
            minHeight: '210mm', // A5 height
            backgroundColor: 'white',
            color: '#111827', // gray-900
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            boxSizing: 'border-box',
            padding: '12mm',
            position: 'relative',
            fontSize: '11px',
            lineHeight: '1.4',
          }}
        >
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.3px' }}>NINOC STUDIO</div>
              <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Bandung, Indonesia</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice</div>
              <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '2px' }}>{orderNumber}</div>
              <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>{formatDate(order.created_at)}</div>
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Tagihan Ke</div>
              <div style={{ fontWeight: 500, fontSize: '11px' }}>{order.shipping_address?.name?.toUpperCase() || 'N/A'}</div>
              <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>{order.shipping_address?.phone || '-'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Kirim Ke</div>
              <div style={{ color: '#4b5563', fontSize: '10px' }}>
                <span style={{ color: '#111827', display: 'block' }}>{order.shipping_address?.address?.toUpperCase() || '-'}</span>
                <span style={{ display: 'block', marginTop: '2px' }}>{order.shipping_address?.city?.toUpperCase() || ''}, {order.shipping_address?.province?.toUpperCase() || ''}</span>
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '8px', fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div style={{ flex: 4 }}>Item</div>
              <div style={{ flex: 1, textAlign: 'right' }}>Harga</div>
              <div style={{ flex: 1, textAlign: 'right' }}>Qty</div>
              <div style={{ flex: 1.5, textAlign: 'right' }}>Total</div>
            </div>
            {order.order_items?.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'flex-start' }}>
                <div style={{ flex: 4 }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: '#111827' }}>{item.product_name}</div>
                  {item.size && <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Ukuran: {item.size}</div>}
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: '10px', color: '#6b7280', paddingTop: '1px' }}>{formatCurrency(item.price_at_purchase)}</div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: '10px', color: '#4b5563', paddingTop: '1px' }}>{item.quantity}</div>
                <div style={{ flex: 1.5, textAlign: 'right', fontSize: '11px', fontWeight: 500, color: '#111827', paddingTop: '1px' }}>{formatCurrency(item.price_at_purchase * item.quantity)}</div>
              </div>
            ))}
          </div>

          {/* TOTALS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <div style={{ width: '140px' }}>
              <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Status</div>
              <div style={{ fontSize: '10px', fontWeight: 500, color: order.payment_status === 'success' ? '#15803d' : '#b45309' }}>
                {order.payment_status === 'success' ? 'LUNAS' : 'MENUNGGU'}
              </div>
              <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '6px' }}>Metode: {order.payment_status === 'success' ? 'VA' : 'Midtrans'}</div>
            </div>

            <div style={{ width: '160px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '10px', color: '#6b7280' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '10px', color: '#6b7280' }}>
                <span>Ongkir</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '10px', color: '#6b7280' }}>
                  <span>Diskon</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', marginTop: '4px', borderTop: '1px solid #e5e7eb', fontSize: '11px', fontWeight: 500, color: '#111827' }}>
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\n        @media print {\n          @page { size: A5; margin: 0; }\n          body * { visibility: hidden; }\n          #printable-invoice, #printable-invoice * { visibility: visible; }\n          #printable-invoice {\n            position: absolute !important; top: 0 !important; left: 0 !important;\n            width: 148mm !important; height: 210mm !important; z-index: 9999 !important; opacity: 1 !important;\n            pointerEvents: auto !important; background: white !important;\n          }\n        }\n      " }} />
    </>
  );
}
