"use client";

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Order } from '@/components/admin/types';

interface InvoiceProps {
  order: Order;
  /** If true, renders a hidden printable version (for print-invoice action) */
  printMode?: boolean;
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
    success: { label: 'LUNAS', color: '#16a34a', bg: '#dcfce7' },
    pending: { label: 'MENUNGGU', color: '#d97706', bg: '#fef3c7' },
    failed: { label: 'GAGAL', color: '#dc2626', bg: '#fee2e2' },
    expired: { label: 'KADALUARSA', color: '#6b7280', bg: '#f3f4f6' },
  };
  const cfg = map[status] || map.pending;
  return (
    <span style={{
      color: cfg.color,
      backgroundColor: cfg.bg,
      padding: '3px 10px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '800',
      letterSpacing: '1.5px',
      fontFamily: 'monospace',
      border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.label}
    </span>
  );
}

export function Invoice({ order, printMode = false }: InvoiceProps) {
  const subtotal = order.order_items?.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0) || 0;
  const shippingCost = 0; // bisa di-override kalau ada data ongkir
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  const orderNumber = order.shipping_address?.name
    ? `NCO-${order.id.slice(0, 8).toUpperCase()}`
    : `NCO-${order.id.slice(0, 8).toUpperCase()}`;

  return (
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
      {/* ══════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '3px solid #111',
        minHeight: '80px',
      }}>
        {/* Brand Block */}
        <div style={{
          flex: 1,
          backgroundColor: '#111',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '12px 16px',
          gap: '2px',
        }}>
          <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>NINOC</span>
          <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '4px', opacity: 0.7 }}>STUDIO</span>
          <span style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px' }}>Bandung, Jawa Barat — Indonesia</span>
        </div>

        {/* Invoice Meta Block */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '12px 16px',
          alignItems: 'flex-end',
          gap: '4px',
        }}>
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

      {/* ══════════════════════════════════════════════════ */}
      {/* FROM / TO */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e5e5' }}>
        {/* FROM */}
        <div style={{ flex: 1, padding: '20px 24px', borderRight: '2px solid #e5e5e5' }}>
          <LabelTag text="PENGIRIM / FROM" />
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <BoldText text="NINOC STUDIO" />
            <LightText text="Bandung, Jawa Barat" />
            <LightText text="Indonesia" />
            <LightText text="0812-XXXX-XXXX" />
            <LightText text="hello@ninoc.co.id" />
          </div>
        </div>

        {/* TO */}
        <div style={{ flex: 1, padding: '20px 24px' }}>
          <LabelTag text="PENERIMA / TO" />
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <BoldText text={order.shipping_address?.name?.toUpperCase() || 'N/A'} />
<LightText text={order.shipping_address?.phone || '-'} />
            <LightText text={order.shipping_address?.address || '-'} />
<LightText text={`${order.shipping_address?.city || ''}, ${order.shipping_address?.province || ''} ${order.shipping_address?.postal_code || ''}`} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ORDER ITEMS TABLE */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{ padding: '0 0 0 0', borderBottom: '2px solid #e5e5e5' }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          backgroundColor: '#111',
          color: 'white',
          padding: '10px 24px',
          gap: '8px',
        }}>
          <div style={{ flex: 3 }}><TableHeader text="DESKRIPSI" /></div>
          <div style={{ flex: 1, textAlign: 'right' }}><TableHeader text="QTY" /></div>
          <div style={{ flex: 1.5, textAlign: 'right' }}><TableHeader text="HARGA SATUAN" /></div>
          <div style={{ flex: 1.5, textAlign: 'right' }}><TableHeader text="SUBTOTAL" /></div>
        </div>

        {/* Table Rows */}
        {order.order_items?.map((item, idx) => {
          const itemSubtotal = item.price_at_purchase * item.quantity;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                padding: '12px 24px',
                gap: '8px',
                borderBottom: idx< (order.order_items?.length ?? 0) - 1 ? '1px solid #f0f0f0' : 'none',
                backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa',
              }}
            >
              <div style={{ flex: 3 }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {item.product_name?.toUpperCase() || 'PRODUK'}
                </span>
                {item.size && (
                  <span style={{ fontSize: '10px', color: '#888', marginTop: '2px', display: 'block' }}>
                    Ukuran: {item.size}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#111' }}>×{item.quantity}</span>
              </div>
              <div style={{ flex: 1.5, textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#444' }}>{formatCurrency(item.price_at_purchase)}</span>
              </div>
              <div style={{ flex: 1.5, textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#111' }}>{formatCurrency(itemSubtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* TOTALS */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e5e5' }}>
        {/* Spacer */}
        <div style={{ flex: 1, padding: '20px 24px' }}>
          <LabelTag text="METODE PEMBAYARAN" />
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#111' }}>
              {order.payment_status === 'success' ? 'VIRTUAL ACCOUNT' : 'MIDTRANS'}
            </span>
          </div>
        </div>

        {/* Totals */}
<div style={{ width: '280px', borderLeft: '2px solid #e5e5e5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>Subtotal</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#111' }}>{formatCurrency(subtotal)}</span>
          </div>
<div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>Ongkos Kirim</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#111' }}>{formatCurrency(shippingCost)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '11px', color: '#16a34a' }}>Diskon</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 20px',
            backgroundColor: '#111',
            color: 'white',
          }}>
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>TOTAL</span>
            <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '0.5px' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* PAYMENT INFO + QR */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e5e5' }}>
        {/* Payment Status */}
        <div style={{ flex: 1, padding: '20px 24px', borderRight: '2px solid #e5e5e5' }}>
          <LabelTag text="STATUS PEMBAYARAN" />
          <div style={{ marginTop: '10px' }}>
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          {order.midtrans_id && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>MIDTRANS ID</span>
              <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: '#111' }}>{order.midtrans_id}</span>
            </div>
          )}
          {order.snap_token && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>SNAP TOKEN</span>
              <span style={{ fontSize: '10px', fontWeight: '600', fontFamily: 'monospace', color: '#444' }}>{order.snap_token.slice(0, 24)}...</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div style={{ width: '200px', padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <QRCodeSVG value={order.id.toUpperCase()} size={60} level="M" />
          <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '2px', color: '#888', textAlign: 'center' }}>SCAN UNTUK VERIFIKASI</span>
          <span style={{ fontSize: '10px', fontWeight: '900', fontFamily: 'monospace', color: '#111', letterSpacing: '1px' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        marginTop: 'auto',
      }}>
        <div>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block' }}>NINOC STUDIO — BANDUNG, JAWA BARAT</span>
          <span style={{ fontSize: '9px', color: '#aaa' }}>hello@ninoc.co.id  •  www.ninoc.co.id</span>
        </div>
        <span style={{ fontSize: '9px', fontWeight: '700', color: '#888', letterSpacing: '2px' }}>
          INVOICE — {orderNumber}
        </span>
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function LabelTag({ text }: { text: string }) {
  return (
    <span style={{
      fontSize: '8px',
      fontWeight: '800',
      letterSpacing: '2px',
      color: '#888',
      textTransform: 'uppercase',
    }}>
      {text}
    </span>
  );
}

function TableHeader({ text }: { text: string }) {
  return (
    <span style={{
      fontSize: '8px',
      fontWeight: '800',
      letterSpacing: '1.5px',
      color: 'rgba(255,255,255,0.7)',
 textTransform: 'uppercase',
    }}>
      {text}
    </span>
  );
}

function BoldText({ text }: { text: string }) {
  return <span style={{ fontSize: '13px', fontWeight: '800', color: '#111', letterSpacing: '0.5px' }}>{text}</span>;
}

function LightText({ text }: { text: string }) {
  return <span style={{ fontSize: '11px', fontWeight: '400', color: '#555' }}>{text}</span>;
}

// ─── Printable Invoice Wrapper ────────────────────────────────────────────────
// Consumer-accessible: rendered in a print-optimized hidden div,
// triggered by window.print() via an injected stylesheet.

export function PrintableInvoice({ order }: { order: Order }) {
  return (
    <>
      {/* Hidden printable invoice — triggered by print action */}
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
        <Invoice order={order} printMode />
      </div>

      {/* Print styles injected into document */}
      <style>{`
        @media print {
          @page {
            size: A5;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 148mm !important;
            z-index: 9999 !important;
            opacity: 1 !important;
            pointerEvents: auto !important;
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}
