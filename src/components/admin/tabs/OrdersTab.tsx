import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Box, X, Calendar, Printer, MapPin, Phone, Package, CreditCard, Truck, Clock, User, Hash, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import CourierLogo from '@/components/CourierLogo';
import { cn, getShippingSLA } from '@/lib/utils';
import { Order, Product } from '../types';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

import { FilterDropdown } from '@/components/admin/ui/FilterDropdown';
import { DateRangeDropdown } from '@/components/admin/ui/DateRangeDropdown';

// ─── Main Component ──────────────────────────────────────
export function OrdersTab({
  orders,
  products,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  openOrderDetail,
  onUpdateOrderPrinted
}: {
  orders: Order[];
  products: Product[];
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  openOrderDetail: (o: Order) => void;
  onUpdateOrderPrinted?: (orderId: string, printedAt: string) => void;
}) {
  // ── Filter states ──
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Print Modal State ──
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintOrders, setSelectedPrintOrders] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // ── Fraud Warning State ──
  const [fraudWarningOrders, setFraudWarningOrders] = useState<Order[]>([]);
  const [isFraudWarningOpen, setIsFraudWarningOpen] = useState(false);

  // ── Expanded Order (accordion) ──
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // ── Dropdown open states (only one at a time) ──
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown(prev => prev === id ? null : id);
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  // ── Barcode Scanner Listener ──
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentTime = Date.now();
      // If time between keystrokes is more than 50ms, it's a human typing, not a scanner. Reset buffer.
      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        const scannedCode = barcodeBuffer.current.trim();
        barcodeBuffer.current = '';

        if (scannedCode) {
          // Check if scanned code matches an order ID or Tracking ID
          const matchedOrder = orders.find(o => 
            o.id.toLowerCase() === scannedCode.toLowerCase() || 
            (o.tracking_id && o.tracking_id.toLowerCase() === scannedCode.toLowerCase())
          );

          if (matchedOrder) {
            // Only update if it's not already shipped or delivered
            if (['pending', 'paid'].includes(matchedOrder.status)) {
              try {
                await supabase
                  .from('orders')
                  .update({ status: 'shipped', updated_at: new Date().toISOString() })
                  .eq('id', matchedOrder.id);
                // Trigger visual feedback (could just use alert for now)
                alert(`📦 Order ${matchedOrder.id.slice(0, 8).toUpperCase()} otomatis diubah menjadi SHIPPED.`);
                // Optimistic update
                matchedOrder.status = 'shipped';
                // Trigger a re-render by calling setStatusFilter with the same value
                setStatusFilter(statusFilter);
              } catch (err) {
                console.error('Failed to update order via scanner', err);
              }
            } else {
              alert(`⚠️ Order ${matchedOrder.id.slice(0, 8).toUpperCase()} sudah berstatus ${matchedOrder.status.toUpperCase()}.`);
            }
          } else {
            console.log('Barcode not found in orders:', scannedCode);
          }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders, setStatusFilter, statusFilter]);

  // ── Derive unique courier options from data ──
  const courierOptions = useMemo(() => {
    const unique = new Set<string>();
    orders.forEach(o => { if (o.courier) unique.add(o.courier); });
    return [
      { id: 'all', label: 'All Couriers' },
      ...Array.from(unique).sort().map(c => ({ id: c, label: c }))
    ];
  }, [orders]);

  // ── Count active filters ──
  const activeFilterCount = [
    paymentFilter !== 'all',
    courierFilter !== 'all',
    dateFrom || dateTo,
    sortBy !== 'all',
  ].filter(Boolean).length;

  // ── Clear all filters ──
  const clearAllFilters = useCallback(() => {
    setPaymentFilter('all');
    setCourierFilter('all');
    setSortBy('all');
    setDateFrom('');
    setDateTo('');
    closeDropdown();
  }, [closeDropdown]);

  // ── Filtering + Sorting ──
  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      // Status tab filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = order.id.toLowerCase().includes(q) ||
          order.shipping_address?.name.toLowerCase().includes(q) ||
          order.shipping_address?.phone.includes(q);
        if (!match) return false;
      }
      // Payment status filter
      if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false;
      // Courier filter
      if (courierFilter !== 'all' && order.courier !== courierFilter) return false;
      // Date range filter
      if (dateFrom) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (orderDate < dateFrom) return false;
      }
      if (dateTo) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (orderDate > dateTo) return false;
      }
      return true;
    });

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.total_price - a.total_price);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.total_price - b.total_price);
    }

    return result;
  }, [orders, statusFilter, searchQuery, paymentFilter, courierFilter, dateFrom, dateTo, sortBy]);

  // ── Handle Bulk Print Resi ──
  const handlePrintResi = () => {
    // Filter only valid orders ready for shipping (e.g., Paid or Shipped)
    const validOrders = filteredOrders.filter(o => o.status === 'paid' || o.status === 'shipped');
    
    if (validOrders.length === 0) {
      alert('Tidak ada order valid (Status: Paid/Sent) pada filter saat ini untuk dicetak.');
      return;
    }
    
    // Set all valid orders as selected by default and open modal
    setSelectedPrintOrders(validOrders.map(o => o.id));
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    if (selectedPrintOrders.length === 0) return;
    setIsPrinting(true);

    const ordersToPrint = orders.filter(o => selectedPrintOrders.includes(o.id));

    // ── FRAUD DETECTION: Check for already-shipped orders ──
    const fraudOrders = ordersToPrint.filter(o =>
      o.status === 'shipped' || o.status === 'delivered'
    );

    if (fraudOrders.length > 0) {
      setIsPrinting(false);
      setFraudWarningOrders(fraudOrders);
      setIsFraudWarningOpen(true);
      return;
    }

    // ── LOG PRINTED TIMESTAMP TO DB (BULK UPDATE) ──
    const now = new Date().toISOString();
    const orderIdsToUpdate = ordersToPrint.map(o => o.id);
    
    supabase.from('orders')
      .update({ printed_at: now })
      .in('id', orderIdsToUpdate)
      .then(({ error }) => {
        if (error) {
          console.error('[Bulk Print] Failed to update printed_at:', error);
          return;
        }
        if (onUpdateOrderPrinted) {
          ordersToPrint.forEach(o => onUpdateOrderPrinted(o.id, now));
        }
      });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsPrinting(false);
      alert('Jendela cetak diblokir oleh browser. Mohon izinkan pop-up (Pop-up Blocker) untuk website ini lalu coba lagi.');
      return;
    }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Label Pengiriman</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              /* Force background colors to print */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              body { 
                margin: 0; 
                padding: 20px; 
                background: #e5e7eb; 
                color: #000;
                font-family: Arial, sans-serif;
              }
              
              .label { 
                background: white; 
                width: 100%; 
                height: 100%;
                margin: 0 auto 20px auto; 
                box-sizing: border-box;
                page-break-after: always;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                display: flex;
                flex-direction: row;
                overflow: hidden;
              }

              .side-margin {
                width: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .side-margin.left { border-right: 1px solid black; }
              .side-margin.right { border-left: 1px solid black; }

              .vertical-text {
                writing-mode: vertical-rl;
                transform: rotate(180deg);
                font-size: 9px;
                font-weight: bold;
                letter-spacing: 1px;
                white-space: nowrap;
              }

              .main-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                position: relative;
              }

              .watermark-fraud {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 32px;
                font-weight: 900;
                color: rgba(255, 0, 0, 0.4);
                border: 4px solid rgba(255, 0, 0, 0.4);
                padding: 10px 20px;
                text-align: center;
                pointer-events: none;
                z-index: 9999;
                text-transform: uppercase;
                width: 120%;
                box-sizing: border-box;
                white-space: pre-wrap;
              }

              .header-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 8px;
                border-bottom: 1px solid black;
                min-height: 45px;
              }
              .courier-logo {
                font-size: 14px;
                font-weight: 800;
                font-style: italic;
                letter-spacing: -0.5px;
                color: black;
              }
              .hotline { font-size: 8px; font-weight: bold; margin-top: 2px; color: #dd0000; }
              .service-type { 
                font-size: 18px; 
                font-weight: 800; 
                text-align: center; 
                padding: 0 8px;
                line-height: 1.1;
              }

              .sender-info {
                padding: 6px 8px;
                border-bottom: 1px dotted black;
              }
              .flex-between { display: flex; justify-content: space-between; font-size: 10px; }
              .uppercase-sm { font-size: 9px; text-transform: uppercase; }

              .receiver-info {
                padding: 6px 8px;
                border-bottom: 1px solid black;
              }
              .address-bold {
                font-size: 9px;
                font-weight: 400;
                line-height: 1.5;
                text-transform: capitalize;
                margin-top: 2px;
              }

              .weight-date {
                display: flex;
                font-size: 9px;
                border-bottom: 1px solid black;
              }
              .weight-date > div { flex: 1; padding: 4px 8px; }
              .weight-date > div:first-child { border-right: 1px solid black; }

              .items-summary {
                padding: 6px 8px;
                font-size: 10px;
                position: relative;
                min-height: 30px;
                border-bottom: 1px solid black;
              }

              .routing-box {
                background-color: black !important;
                color: white !important;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                padding: 4px 0;
                letter-spacing: 1px;
                border-bottom: 1px solid black;
              }

              .routing-code {
                text-align: center;
                font-size: 28px;
                font-weight: bold;
                padding: 8px 0 4px;
                line-height: 1;
              }

              .main-barcode-sec {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid black;
              }
              .tracking-text {
                font-size: 14px;
                font-weight: bold;
                margin-top: 4px;
                letter-spacing: 2px;
              }
              .tc-text { font-size: 7px; margin-top: 4px; }

              .order-id-row {
                display: flex;
                justify-content: space-between;
                font-size: 9px;
                font-weight: bold;
                padding: 4px 8px;
                border-bottom: 2px solid black;
              }

              .items-table-container {
                padding: 6px 8px;
                font-size: 8px;
                border-bottom: 1px solid black;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 2px;
              }
              .items-table th { border-bottom: 1px solid black; text-align: left; padding-bottom: 2px; }
              .items-table td { padding-top: 2px; vertical-align: top; }

              .footer-logos {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 8px;
                flex: 1;
              }

              @media print {
                body { background: white; padding: 0; margin: 0; }
                .label { margin: 0; box-shadow: none; border: none; break-after: page; page-break-after: always; }
                @page { margin: 0; size: 100mm 150mm; }
              }
            </style>
          </head>
          <body>
            ${ordersToPrint.map(order => {
              const trackingId = order.tracking_id || 'JX9689052297';
              const courierParts = (order.courier || 'J&T EXPRESS').toUpperCase().split(' ');
              const courierName = courierParts[0];
              const serviceType = courierParts.slice(1).join(' ') || 'REG';
              const totalItems = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
              const totalWeight = order.order_items?.reduce((s, i) => s + ((i as any).weight_grams || 250) * i.quantity, 0) || 250;

              const shipDate = new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
              
              const routingCode = order.shipping_address?.postal_code ? 'NNC-' + order.shipping_address.postal_code.slice(0, 5) : 'NNC-STD';
              const destinationHub = (order.shipping_address?.city || 'DESTINATION').toUpperCase();
              
              let shortItemsStr = order.order_items?.slice(0, 3).map(i => { const v = [i.color, i.size].filter(Boolean).join(' / '); return i.product_name + ' (' + (v || 'One Size') + ')'; }).join(', ') || '';
              if ((order.order_items?.length || 0) > 3) shortItemsStr += ', dll...';

              const receiverName = order.shipping_address?.name || 'Customer';
              const rawPhone = order.shipping_address?.phone || '+628000000000';
              const receiverPhone = rawPhone.length >= 8 ? rawPhone.slice(0, 4) + 'XXXX' + rawPhone.slice(-4) : rawPhone;
              let rawAddress = order.shipping_address?.address || '';
              if (rawAddress) {
                // Normalize terms to catch duplicates like "Kecamatan Subang" vs "Kec. Subang"
                let normalized = rawAddress.replace(/KECAMATAN /gi, 'KEC. ').replace(/KABUPATEN /gi, 'KAB. ').replace(/KELURAHAN /gi, 'KEL. ');
                const chunks = normalized.split(',').map(c => c.trim());
                const uniqueChunks = Array.from(new Set(chunks.map(c => c.toUpperCase())))
                  .map(upperC => chunks.find(c => c.toUpperCase() === upperC));
                rawAddress = uniqueChunks.filter(Boolean).join(', ');
              }
              const receiverAddress = rawAddress;
              
              const cCity = order.shipping_address?.city || '';
              const cProv = order.shipping_address?.province || '';
              let receiverLocation = [cCity, cProv].filter(Boolean).join(', ');
              
              // Prevent printing Location at the bottom if it's already in the main address
              if (receiverAddress.toUpperCase().includes(cCity.toUpperCase()) && receiverAddress.toUpperCase().includes(cProv.toUpperCase())) {
                receiverLocation = '';
              } else if (receiverAddress.toUpperCase().includes(cCity.toUpperCase())) {
                receiverLocation = cProv;
              } else if (receiverAddress.toUpperCase().includes(cProv.toUpperCase())) {
                receiverLocation = cCity;
              }
              
              const addressType = order.shipping_address?.address_type;
              const addressTypeLabel = addressType ? `<div style="display:inline-block; border:1px solid black; padding:1px 4px; font-size:8px; font-weight:bold; margin-top:2px; margin-bottom:2px;">${addressType === 'Home' ? 'Home / Rumah' : 'Office / Kantor'}</div>` : '';

              const maxItems = 4;
              const itemsList = order.order_items?.slice(0, maxItems).map(i => 
                '<tr><td>' + i.product_name + '</td><td>' + ([i.color, i.size].filter(Boolean).join(' / ') || '-') + '</td><td style="text-align:right">' + i.quantity + '</td></tr>'
              ).join('') || '';
              
              const itemsRemaining = (order.order_items?.length || 0) - maxItems;
              const remainingRow = itemsRemaining > 0 ? '<tr><td colspan="3" style="padding-top:4px; font-style:italic; color:#555">+ ' + itemsRemaining + ' produk lainnya... (Lihat Packing Slip)</td></tr>' : '';

              return `
              <div class="label">
                
                <div class="side-margin left">
                  <div class="vertical-text">${trackingId}</div>
                </div>

                <div class="main-content">
                  ${order.print_count && order.print_count > 1 ? '<div class="watermark-fraud">DUPLICATE REPRINT<br/><span style="font-size: 16px;">UNAUTHORIZED DISPATCH</span></div>' : ''}
                  <div class="header-section">
                    <div style="flex:1">
                      <div class="courier-logo">${courierName}</div>
                      <div class="hotline">(021) 80661888</div>
                    </div>
                    <div class="service-type">${serviceType}</div>
                    <div style="flex:1; text-align:right">
                       <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${trackingId}" alt="QR" style="width:36px; height:36px; display:inline-block;" />
                    </div>
                  </div>

                  <div class="sender-info">
                    <div class="flex-between">
                      <div><span style="font-weight:bold">Pengirim :</span> NINOC ENTERPRISE</div>
                      <div>+628211983774</div>
                    </div>
                    <div class="uppercase-sm">JAWA BARAT, BANDUNG</div>
                  </div>

                  <div class="receiver-info">
                    <div class="flex-between">
                      <div><span style="font-weight:bold">Penerima :</span> ${receiverName}</div>
                      <div>${receiverPhone}</div>
                    </div>
                    ${addressTypeLabel}
                    <div class="uppercase-sm">${receiverLocation}</div>
                    <div class="address-bold">${receiverAddress}</div>
                  </div>

                  <div class="weight-date">
                    <div>Weight : ${totalWeight} Gram</div>
                    <div>Ship : ${shipDate}</div>
                  </div>

                  <div class="items-summary">
                    Jumlah : ${totalItems}pcs, Barang : ${shortItemsStr}
                  </div>

                  <div class="routing-code">${routingCode}</div>

                  <div class="main-barcode-sec">
                    <svg class="barcode"
                      jsbarcode-format="CODE128"
                      jsbarcode-value="${trackingId}"
                      jsbarcode-textmargin="0"
                      jsbarcode-fontoptions="bold"
                      jsbarcode-height="50"
                      jsbarcode-displayvalue="false"
                      jsbarcode-width="2"
                      jsbarcode-margin="0">
                    </svg>
                    <div class="tracking-text">${trackingId}</div>
                    <div class="tc-text">Syarat dan ketentuan pengiriman dapat dilihat pada website ninoc.store</div>
                  </div>

                  <div class="order-id-row">
                    <div>Order Id : ${order.id.toUpperCase()}</div>
                  </div>

                  <div class="items-table-container">
                    <div style="color:#666; margin-bottom:2px">In transit by: ${shipDate}</div>
                    <table class="items-table">
                      <thead>
                        <tr><th style="width:50%">Product Name</th><th>SKU</th><th style="text-align:right">Qty</th></tr>
                      </thead>
                      <tbody>
                        ${itemsList}
                        ${remainingRow}
                      </tbody>
                    </table>
                    <div style="text-align:right; font-weight:bold; border-top:1px solid black; padding-top:2px; margin-top:4px">
                      Qty Total: ${totalItems}
                    </div>
                  </div>

                  <div class="footer-logos">
                    <div style="font-size:16px; font-weight:bold; letter-spacing:-1px">ninoc.store</div>
                    <div style="font-size:6px; text-align:right">
                      Order ID: ${order.id.toUpperCase()}<br/>
                      Printed: ${new Date().toLocaleString('id-ID')}
                    </div>
                  </div>

                </div>

                <div class="side-margin right">
                  <div class="vertical-text">${trackingId}</div>
                </div>

              </div>
              `;
            }).join('')}
            
            <script>
              JsBarcode(".barcode").init();
              window.onload = () => { setTimeout(() => { window.print(); }, 800); }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Reset state and close modal
      setIsPrinting(false);
      setIsPrintModalOpen(false);
  };

  const handleExportData = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NINOC STORE - TAX REPORT (CSV/PDF)</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 20px; color: #141414; }
            .header { text-align: center; border-bottom: 2px solid #141414; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
            .subtitle { font-size: 10px; font-weight: 600; letter-spacing: 1px; color: #666; text-transform: uppercase; margin-top: 5px; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px; }
            th, td { border: 1px solid #e5e5e5; padding: 10px; text-align: left; }
            th { background-color: #141414; color: white; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
            tr:nth-child(even) { background-color: #fafafa; }
            .total-row { font-weight: 800; background-color: #f1f1f1 !important; }
            .footer { font-size: 10px; color: #666; text-align: center; margin-top: 50px; border-top: 1px solid #e5e5e5; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">NINOC STORE</div>
            <div class="subtitle">Official Transaction & Tax Report</div>
          </div>
          <div class="meta">
            <div>REPORT GENERATED: ${new Date().toLocaleString('id-ID')}</div>
            <div>TOTAL RECORDS: ${filteredOrders.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total Amount (IDR)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => {
                const tax = order.total_price * 0.11;
                return (
                  '<tr>' +
                    '<td>' + new Date(order.created_at).toLocaleString('id-ID') + '</td>' +
                    '<td style="font-family: monospace;">' + order.id.toUpperCase() + '</td>' +
                    '<td>' + (order.shipping_address?.name || '-') + '</td>' +
                    '<td>' + order.status.toUpperCase() + '</td>' +
                    '<td>' + order.payment_status.toUpperCase() + '</td>' +
                    '<td>' + order.total_price.toLocaleString('id-ID') + '</td>' +
                  '</tr>'
                );
              }).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">GRAND TOTAL</td>
                <td>${filteredOrders.reduce((acc, order) => acc + order.total_price, 0).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            CONFIDENTIAL - Internal Use Only - System Generated Document
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleCancelOrder = async (order: Order) => {
    if (!order) return;
    
    // Warning prompt
    const confirmCancel = window.confirm(`PEMBATALAN ORDER #${order.id.toUpperCase()}\n\nPERINGATAN FINANCE:\nMidtrans akan mengembalikan dana penuh ke Customer. Biaya admin (MDR) akan DITANGGUNG oleh Ninoc.\nJika Customer membayar via Transfer Bank/VA, Anda wajib melakukan REFUND MANUAL!\n\nLanjutkan Pembatalan?`);
    
    if (!confirmCancel) return;
    
    const reason = window.prompt("Alasan pembatalan (opsional):", "Dibatalkan sepihak oleh Admin");
    if (reason === null) return;

    try {
      const res = await fetch('/api/admin/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, reason })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');
      
      alert(`Sukses membatalkan pesanan.\nStatus Refund: ${data.refund_status}`);
      window.location.reload();
    } catch (err: any) {
      alert(`Gagal membatalkan pesanan: ${err.message}`);
    }
  };

  const handlePrintSingleLabel = (order: Order) => {
    setSelectedPrintOrders([order.id]);
    setIsPrintModalOpen(true);
  };

  return (
    <>
      <motion.div
        key="orders"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full space-y-2"
      >
        <div className="shrink-0 flex items-center justify-between border-b border-ink/5">
          <div>
            <h2 className="text-lg font-medium text-ink tracking-tight leading-tight">Online Order</h2>
            <p className="text-[9px] uppercase tracking-wider text-ink/80 mt-0.5">Transaction History &amp; Management</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintResi}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-ink/10 text-ink/90 text-[9px] uppercase font-medium tracking-wider rounded hover:bg-ink/5 hover:text-ink transition-colors"
            >
              <Printer size={10} />
              Print Bulk Labels
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose text-white text-[9px] uppercase font-medium tracking-wider rounded hover:bg-rose/90 transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>

      {/* Status Tabs */}
      <div className="shrink-0 flex items-center gap-1 border-b border-ink/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Order', count: orders.length },
          { id: 'pending', label: 'New Order', count: orders.filter(o => o.status === 'pending').length },
          { id: 'paid', label: 'Paid', count: orders.filter(o => o.status === 'paid').length },
          { id: 'shipped', label: 'Sent', count: orders.filter(o => o.status === 'shipped').length },
          { id: 'delivered', label: 'Completed', count: orders.filter(o => o.status === 'delivered').length },
          { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "relative px-1.5 py-1 text-[9px] uppercase font-medium tracking-wider whitespace-nowrap transition-colors",
              statusFilter === tab.id ? "text-rose" : "text-ink/80 hover:text-ink/90"
            )}
          >
            {tab.label}
            <span className={cn(
              "ml-2 px-1.5 py-0.5 text-[9px] rounded",
              statusFilter === tab.id ? "bg-rose/10 text-rose" : "bg-ink/5 text-ink/80"
            )}>
              {tab.count}
            </span>
            {statusFilter === tab.id && (
              <motion.div layoutId="orderTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose" />
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Master Filter Button */}
          <button
            onClick={activeFilterCount > 0 ? clearAllFilters : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-sm text-[10px] font-medium uppercase tracking-wider transition-colors",
              activeFilterCount > 0
                ? "border-rose/30 bg-rose/10 text-rose hover:bg-rose/20"
                : "border-ink/10 text-ink/80"
            )}
          >
            {activeFilterCount > 0 ? (
              <>
                <X size={10} />
                Clear {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <Filter size={12} /> Filter
              </>
            )}
          </button>

          <div className="h-4 w-px bg-ink/10 mx-1" />

          {/* Payment Method Dropdown */}
          <FilterDropdown
            label="Payment Method"
            options={[
              { id: 'all', label: 'All Payment' },
              { id: 'pending', label: 'Pending' },
              { id: 'success', label: 'Success' },
              { id: 'failed', label: 'Failed' },
              { id: 'expired', label: 'Expired' },
            ]}
            value={paymentFilter}
            onChange={setPaymentFilter}
            isOpen={openDropdown === 'payment'}
            onToggle={() => toggleDropdown('payment')}
            onClose={closeDropdown}
          />

          {/* Courier Dropdown */}
          <FilterDropdown
            label="Courier"
            options={courierOptions}
            value={courierFilter}
            onChange={setCourierFilter}
            isOpen={openDropdown === 'courier'}
            onToggle={() => toggleDropdown('courier')}
            onClose={closeDropdown}
          />

          {/* Date Range Dropdown */}
          <DateRangeDropdown
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChangeFrom={setDateFrom}
            onChangeTo={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo(''); }}
            isOpen={openDropdown === 'date'}
            onToggle={() => toggleDropdown('date')}
            onClose={closeDropdown}
          />

          {/* Sort By Dropdown */}
          <FilterDropdown
            label="Sort By"
            options={[
              { id: 'all', label: 'Default' },
              { id: 'newest', label: 'Newest First' },
              { id: 'oldest', label: 'Oldest First' },
              { id: 'highest', label: 'Highest Amount' },
              { id: 'lowest', label: 'Lowest Amount' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            isOpen={openDropdown === 'sort'}
            onToggle={() => toggleDropdown('sort')}
            onClose={closeDropdown}
          />
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/90" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-ink/10 rounded-sm text-[10px] font-medium focus:outline-none focus:border-rose/50 transition-colors placeholder:text-ink/80"
          />
        </div>
      </div>

      {/* Order Table */}
      <div className="flex-1 min-h-0 flex flex-col border border-ink/10 rounded-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex-1 py-12 flex flex-col items-center justify-center">
            <Box size={24} className="text-ink/80 mb-2" />
            <p className="text-[10px] uppercase tracking-wider font-medium text-ink/80">No orders found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto minimal-scroll relative bg-white">
            
            {/* MOBILE CARD VIEW */}
            <div className="lg:hidden flex flex-col gap-2 p-2 bg-gray-50/50">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => openOrderDetail(order)}
                  className="bg-white border border-ink/10 rounded-xl p-3 flex flex-col gap-2 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-ink">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-[10px] text-ink/60">{format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold",
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 bg-ink/5 rounded-full flex items-center justify-center shrink-0">
                      <User size={14} className="text-ink/60" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[11px] font-bold text-ink truncate">{order.shipping_address?.name || order.user_id?.slice(0,8) || 'Guest'}</span>
                      <span className="text-[10px] text-ink/60 truncate flex items-center gap-1"><MapPin size={10} /> {order.shipping_address?.city || 'Unknown City'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-ink/5 pt-2 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-ink/60">Total</span>
                      <span className="text-[11px] font-bold font-mono text-ink">Rp {order.total_price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] uppercase tracking-widest text-ink/60">Courier</span>
                      <div className="flex items-center gap-1">
                        {order.courier ? (
                           <>
                             <CourierLogo courier={order.courier} className="h-2.5" />
                             <span className="text-[10px] font-bold text-ink">{order.courier.toUpperCase()}</span>
                           </>
                        ) : (
                           <span className="text-[10px] font-bold text-ink/50">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <table className="hidden lg:table w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-ink/[0.03] border-b border-ink/10">
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap">Order ID</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap">Date</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap">Product</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap">Status</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap">Payment</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap">Courier</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap text-right">Amount</th>
                  <th className="px-1.5 py-1 text-[10px] uppercase tracking-widest text-ink/80 font-medium whitespace-nowrap w-[1%]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={cn(
                          "border-b border-ink/5 hover:bg-ink/[0.02] transition-colors cursor-pointer group",
                          isExpanded && "bg-ink/[0.02] border-b-0"
                        )}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="px-1.5 py-1">
                          <span className="text-[11px] font-medium text-ink font-mono tracking-wider">#{order.id.toUpperCase()}</span>
                        </td>
                        <td className="px-1.5 py-1">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-medium text-ink/90 whitespace-nowrap">{new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            {order.status === 'paid' && (
                              <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded-sm border uppercase w-fit tracking-wider", getShippingSLA(order.created_at, order.courier).badgeClass)}>
                                {getShippingSLA(order.created_at, order.courier).label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-1.5 py-1">
                          <div className="max-w-[120px]">
                            <p className="text-[11px] font-medium text-ink truncate">{order.shipping_address?.name || '—'}</p>
                            <p className="text-[10px] text-ink/80 font-mono truncate">{order.shipping_address?.phone || ''}</p>
                          </div>
                        </td>
                        <td className="px-1.5 py-1">
                          <div className="max-w-[160px]">
                            <p className="text-[11px] font-medium text-ink line-clamp-2">{order.order_items?.[0]?.product_name || '—'}</p>
                            {order.order_items && order.order_items.length > 1 && (
                              <span className="text-[10px] text-rose font-medium">+{(order.order_items?.length || 0) - 1} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-1.5 py-1">
                          <span className={cn(
                            "inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap",
                            order.status === 'pending' ? "bg-amber-50 text-amber-600" :
                            order.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                            order.status === 'shipped' ? "bg-blue-50 text-blue-600" :
                            order.status === 'delivered' ? "bg-teal-50 text-teal-600" :
                            "bg-red-50 text-red-600"
                          )}>
                            {order.status === 'pending' ? 'Waiting' : order.status}
                          </span>
                        </td>
                        <td className="px-1.5 py-1">
                          <div className="flex flex-col gap-0.5">
                            <span className={cn(
                              "text-[10px] uppercase tracking-wider font-medium",
                              order.payment_status === 'success' ? "text-emerald-600" :
                              order.payment_status === 'pending' ? "text-amber-600" : "text-red-600"
                            )}>
                              {order.payment_status}
                            </span>
                            {order.payment_method && (
                              <span className="text-[9px] text-ink/70 font-medium uppercase tracking-wider">
                                {order.payment_method.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-1.5 py-1">
                          <span className="text-[11px] font-medium text-ink/90 uppercase">{order.courier || '—'}</span>
                        </td>
                        <td className="px-1.5 py-1 text-right">
                          <span className="text-[11px] font-medium text-ink whitespace-nowrap">{order.total_price.toLocaleString('id-ID')}</span>
                        </td>
                        <td className="px-1.5 py-1">
                          <div className="flex items-center gap-1">
                            {isExpanded ? <ChevronUp size={12} className="text-rose" /> : <ChevronDown size={12} className="text-ink/90 group-hover:text-ink/80 transition-colors" />}
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDABLE DETAIL ROW ── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0 border-b border-ink/10">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="bg-ink/[0.015] border-t border-ink/10 px-4 py-5">
                                  <div className="grid grid-cols-12 gap-2">

                                    {/* LEFT: Product Items with Images */}
                                    <div className="col-span-5">
                                      <div className="flex items-center gap-1.5 mb-3">
                                        <Package size={11} className="text-ink/80" />
                                        <span className="text-[9px] uppercase tracking-widest font-medium text-ink/80">Ordered Items</span>
                                      </div>
                                      <div className="space-y-2">
                                        {order.order_items?.map((item, idx) => {
                                          const foundProduct = products.find(p => p.id === item.product_id);
                                          return (
                                            <div key={idx} className="flex items-center gap-3 bg-white border border-ink/5 p-2.5 rounded-sm">
                                              <div className="w-12 h-12 bg-ink/5 border border-ink/10 rounded-sm flex items-center justify-center shrink-0 overflow-hidden relative">
                                                {foundProduct?.image_url ? (
                                                  <Image src={foundProduct.image_url} alt={item.product_name || 'Product'} fill className="object-cover" />
                                                ) : (
                                                  <Package size={16} className="text-ink/80" />
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs md:text-[11px] font-medium text-ink line-clamp-2">{item.product_name || 'Product'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                  {item.color && <span className="text-[9px] font-medium text-ink/90 bg-ink/5 px-1.5 py-0.5 rounded-sm">{item.color}</span>}
                                                  {item.size && <span className="text-[9px] font-medium text-ink/90 bg-ink/5 px-1.5 py-0.5 rounded-sm">{item.size}</span>}
                                                  <span className="text-[9px] font-medium text-ink/90">×{item.quantity}</span>
                                                </div>
                                              </div>
                                              <div className="text-right shrink-0">
                                                <p className="text-[10px] font-medium text-ink">IDR {item.price_at_purchase.toLocaleString('id-ID')}</p>
                                                <p className="text-[9px] text-ink/80">per item</p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {/* Total */}
                                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-ink/10">
                                        <span className="text-[10px] font-medium text-ink/90 uppercase tracking-wider">Total ({order.order_items?.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                        <span className="text-[13px] font-medium text-ink">IDR {order.total_price.toLocaleString('id-ID')}</span>
                                      </div>
                                    </div>

                                    {/* MIDDLE: Customer & Shipping */}
                                    <div className="col-span-4">
                                      <div className="flex items-center gap-1.5 mb-3">
                                        <User size={11} className="text-ink/80" />
                                        <span className="text-[9px] uppercase tracking-widest font-medium text-ink/80">Customer &amp; Shipping</span>
                                      </div>
                                      <div className="bg-white border border-ink/5 p-3 rounded-sm space-y-3">
                                        <div className="flex items-start gap-2">
                                          <User size={10} className="text-ink/90 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-xs md:text-[11px] font-medium text-ink">{order.shipping_address?.name || '—'}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <Phone size={8} className="text-ink/90" />
                                              <span className="text-[9px] text-ink/90 font-mono">
                                                {order.shipping_address?.phone
                                                  ? (order.shipping_address.phone.length >= 8
                                                    ? order.shipping_address.phone.slice(0, 4) + '-****-' + order.shipping_address.phone.slice(-4)
                                                    : order.shipping_address.phone)
                                                  : '—'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-start gap-2">
                                          <MapPin size={10} className="text-ink/90 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-[10px] text-ink/90 leading-relaxed">{order.shipping_address?.address || '—'}</p>
                                            {!(order.shipping_address?.address || '').toUpperCase().includes((order.shipping_address?.city || '').toUpperCase()) && (
                                              <p className="text-[10px] font-medium text-ink mt-0.5">
                                                {order.shipping_address?.city}{order.shipping_address?.province ? `, ${order.shipping_address.province}` : ''}
                                              </p>
                                            )}
                                            {order.shipping_address?.postal_code && !(order.shipping_address?.address || '').includes(order.shipping_address.postal_code) && (
                                              <p className="text-[10px] font-medium text-ink">{order.shipping_address.postal_code}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-start gap-2">
                                          <Truck size={10} className="text-ink/90 mt-0.5 shrink-0" />
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <CourierLogo courier={order.courier || ''} className="h-4" />
                                              <p className="text-[10px] font-medium text-ink uppercase">{order.courier || 'Not Assigned'}</p>
                                            </div>
                                            {order.tracking_id && (
                                              <p className="text-[9px] text-ink/90 font-mono mt-0.5">Resi: {order.tracking_id}</p>
                                            )}
                                            {order.courier_driver_name && (
                                              <p className="text-[9px] text-emerald-600 font-medium mt-1">Driver: {order.courier_driver_name}</p>
                                            )}
                                            {order.courier_link && (
                                              <a href={order.courier_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-[9px] text-rose uppercase tracking-widest font-medium hover:underline">
                                                Track on Courier ↗
                                              </a>
                                            )}
                                            {order.status === 'paid' && (
                                              <div className="mt-2.5 p-2 border border-rose/20 rounded-sm bg-rose/5 inline-block">
                                                <p className="text-[9px] uppercase tracking-widest text-rose font-semibold mb-1">Batas Tanggal Dikirim</p>
                                                <div className="flex items-center gap-1.5">
                                                  <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded-sm border uppercase tracking-wider", getShippingSLA(order.created_at, order.courier).badgeClass)}>
                                                    {getShippingSLA(order.created_at, order.courier).label}
                                                  </span>
                                                  <span className="text-[10px] font-bold text-rose">
                                                    {getShippingSLA(order.created_at, order.courier).deadlineDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* RIGHT: Order Meta & Status */}
                                    <div className="col-span-3">
                                      <div className="flex items-center gap-1.5 mb-3">
                                        <Hash size={11} className="text-ink/80" />
                                        <span className="text-[9px] uppercase tracking-widest font-medium text-ink/80">Order Meta</span>
                                      </div>
                                      <div className="bg-white border border-ink/5 p-3 rounded-sm space-y-3">
                                        <div>
                                          <p className="text-[9px] uppercase tracking-widest text-ink/90 mb-1">Order ID</p>
                                          <p className="text-[10px] font-medium text-ink font-mono">#{order.id.toUpperCase()}</p>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div>
                                          <p className="text-[9px] uppercase tracking-widest text-ink/90 mb-1">Date &amp; Time</p>
                                          <p className="text-[10px] font-medium text-ink">
                                            {new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-center gap-2">
                                          <CreditCard size={10} className="text-ink/90" />
                                          <div>
                                            <p className="text-[9px] uppercase tracking-widest text-ink/90 mb-0.5">Payment</p>
                                            <span className={cn(
                                              "text-[9px] uppercase tracking-wider font-medium",
                                              order.payment_status === 'success' ? "text-emerald-600" :
                                              order.payment_status === 'pending' ? "text-amber-600" : "text-red-600"
                                            )}>{order.payment_status} {order.payment_method ? `• ${order.payment_method.replace(/_/g, ' ')}` : ''}</span>
                                          </div>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-center gap-2">
                                          <Clock size={10} className="text-ink/90" />
                                          <div>
                                            <p className="text-[9px] uppercase tracking-widest text-ink/90 mb-0.5">Status</p>
                                            <div className="flex items-center gap-2">
                                              <span className={cn(
                                                "inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium",
                                                order.status === 'pending' ? "bg-amber-50 text-amber-600" :
                                                order.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                                                order.status === 'shipped' ? "bg-blue-50 text-blue-600" :
                                                order.status === 'delivered' ? "bg-teal-50 text-teal-600" :
                                                "bg-red-50 text-red-600"
                                              )}>{order.status === 'pending' ? 'Waiting' : order.status}</span>

                                            </div>
                                          </div>
                                        </div>
                                        {order.midtrans_id && (
                                          <>
                                            <div className="h-px bg-ink/5" />
                                            <div>
                                              <p className="text-[9px] uppercase tracking-widest text-ink/90 mb-1">Transaction ID</p>
                                              <p className="text-[9px] font-medium text-ink/90 font-mono break-all">{order.midtrans_id}</p>
                                            </div>
                                          </>
                                        )}
                                        {order.status === 'cancelled' && order.notes?.includes('Manual Refund') && (
                                          <>
                                            <div className="h-px bg-ink/5" />
                                            <div>
                                              <p className="text-[9px] uppercase tracking-widest text-red-600 mb-1 font-bold">Manual Refund Info</p>
                                              {order.refund_bank_details ? (
                                                <div className="bg-red-50 p-2 rounded-sm border border-red-100/50">
                                                  <p className="font-bold text-red-800 uppercase tracking-wider text-[10px]">{order.refund_bank_details.bank_name}</p>
                                                  <p className="font-mono font-medium text-red-900 text-[10px]">{order.refund_bank_details.account_number}</p>
                                                  <p className="text-red-700/80 uppercase text-[9px] mt-0.5">A.N {order.refund_bank_details.account_name}</p>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-1.5 p-1.5 bg-red-50/50 border border-red-100/50 rounded-sm">
                                                  <Clock size={10} className="text-red-500" />
                                                  <p className="text-[9px] text-red-600 font-medium uppercase tracking-widest">Menunggu Data Rekening</p>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      <div className="mt-4">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handlePrintSingleLabel(order); }}
                                          disabled={order.status === 'pending' || order.payment_status === 'pending'}
                                          className="w-full flex justify-center items-center gap-2 bg-ink text-white py-2.5 rounded-sm hover:bg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-medium uppercase tracking-widest"
                                        >
                                          <Printer size={12} />
                                          Print Shipping Label
                                        </button>
                                        {['pending', 'paid', 'shipped'].includes(order.status) && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleCancelOrder(order); }}
                                            disabled={order.status === 'shipped'}
                                            className={`w-full mt-2 flex justify-center items-center gap-2 py-2 rounded-sm text-[10px] font-medium uppercase tracking-widest transition-all ${
                                              order.status === 'shipped'
                                                ? 'bg-ink/5 text-ink/40 border border-ink/10 cursor-not-allowed'
                                                : 'bg-white text-rose border border-rose hover:bg-rose hover:text-white'
                                            }`}
                                          >
                                            <X size={12} />
                                            Cancel Order
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="shrink-0 flex items-center justify-between py-2 border-t border-ink/5">
          <div className="flex items-center gap-2 text-[10px] uppercase font-medium tracking-wider text-ink/80">
            Show
            <select className="bg-transparent border border-ink/10 rounded-sm px-2 py-1 outline-none text-ink">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            per page
          </div>
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/80 hover:text-ink hover:border-ink/20 transition-colors">
              <ChevronLeft size={12} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center border border-rose bg-rose text-white rounded-sm text-[10px] font-medium transition-colors">
              1
            </button>
            <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/80 hover:text-ink hover:border-ink/20 transition-colors text-[10px] font-medium">
              2
            </button>
            <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/80 hover:text-ink hover:border-ink/20 transition-colors">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </motion.div>

    {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-2">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => !isPrinting && setIsPrintModalOpen(false)}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl bg-white rounded-sm shadow-2xl border border-ink/10 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-1.5 py-1 border-b border-ink/10 flex items-center justify-between bg-ink/[0.02]">
              <div>
                <h3 className="text-xs font-medium text-ink uppercase tracking-wide">Select Orders to Print</h3>
                <p className="text-[10px] text-ink/90 uppercase tracking-widest mt-1">Thermal Label (100x150mm)</p>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                disabled={isPrinting}
                className="p-2 text-ink/80 hover:text-ink transition-colors disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body / List */}
            <div className="flex-1 overflow-y-auto minimal-scroll p-3 bg-white">
              <div className="space-y-2">
                {(() => {
                  const validOrders = filteredOrders.filter(o => o.status === 'paid');
                  const validCount = validOrders.length;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-ink/5 mb-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedPrintOrders.length === validCount && validCount > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedPrintOrders(validOrders.map(o => o.id));
                              else setSelectedPrintOrders([]);
                            }}
                          />
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                            selectedPrintOrders.length === validCount && validCount > 0
                              ? "bg-ink border-ink" : "border-ink/20 group-hover:border-ink/40"
                          )}>
                            {selectedPrintOrders.length === validCount && validCount > 0 && <Box size={10} className="text-white" />}
                          </div>
                          <span className="text-[10px] uppercase font-medium tracking-wider text-ink">Select All ({validCount})</span>
                        </label>
                      </div>

                      {validOrders.map((order) => (
                        <label key={order.id} className="flex items-center gap-2 p-3 border border-ink/5 rounded-sm hover:border-ink/20 cursor-pointer transition-colors group">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedPrintOrders.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedPrintOrders(prev => [...prev, order.id]);
                              else setSelectedPrintOrders(prev => prev.filter(id => id !== order.id));
                            }}
                          />
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors shrink-0",
                            selectedPrintOrders.includes(order.id) ? "bg-ink border-ink" : "border-ink/20 group-hover:border-ink/40"
                          )}>
                            {selectedPrintOrders.includes(order.id) && <Box size={10} className="text-white" />}
                          </div>
                          
                          <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-ink font-mono tracking-wider">#{order.id.toUpperCase()}</p>
                                <span className="text-[9px] text-ink/90 font-medium font-mono bg-ink/5 px-1.5 py-0.5 rounded-sm border border-ink/10">{new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs md:text-[11px] font-medium text-ink mt-1 truncate">
                                {order.shipping_address?.name || 'Guest'} <span className="text-ink/90 mx-1">•</span> <span className="text-ink/90">{order.shipping_address?.city || 'Unknown City'}</span>
                              </p>
                              <p className="text-[10px] text-ink/80 mt-0.5 truncate">
                                <span className="font-medium text-ink/80">{order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0} items</span> — {order.order_items?.[0]?.product_name || 'Product'} {order.order_items && order.order_items.length > 1 ? `+${(order.order_items?.length || 0) - 1} more` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap",
                                order.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                              )}>
                                {order.status}
                              </span>
                              <span className="text-[10px] font-medium text-ink/90 uppercase w-16 text-right">{order.courier || 'STD'}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                      
                      {validCount === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-ink/80">No valid orders found in current filter</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-1.5 py-1 border-t border-ink/10 bg-ink/[0.02] flex justify-between items-center shrink-0">
              <span className="text-[10px] uppercase font-medium tracking-wider text-ink/90">
                {selectedPrintOrders.length} Orders Selected
              </span>
              
              <button
                onClick={executePrint}
                disabled={selectedPrintOrders.length === 0 || isPrinting}
                className="relative flex items-center justify-center gap-2 px-6 py-2.5 bg-ink text-white text-[10px] uppercase font-medium tracking-wider rounded-sm hover:bg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden min-w-[160px]"
              >
                {isPrinting ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Generating...
                  </motion.div>
                ) : (
                  <>
                    <Printer size={12} />
                    Print Labels
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    {/* FRAUD WARNING MODAL */}
    <AnimatePresence>
      {isFraudWarningOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose/20 backdrop-blur-sm"
            onClick={() => setIsFraudWarningOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border-2 border-rose overflow-hidden"
          >
            {/* Header */}
            <div className="px-1.5 py-1 bg-rose flex items-center gap-3">
              <AlertTriangle size={20} className="text-white" />
              <div>
                <h3 className="text-xs font-medium text-white uppercase tracking-widest">Fraud Alert</h3>
                <p className="text-[10px] text-white/80 uppercase tracking-wider mt-0.5">Duplicate Print Blocked</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
              <p className="text-xs md:text-[11px] text-ink/90 leading-relaxed">
                <span className="font-medium text-rose">{fraudWarningOrders.length} order(s)</span> yang Anda coba cetak sudah memiliki status <span className="font-medium">SHIPPED / DELIVERED</span>. Ini mengindikasikan <span className="font-medium text-rose">DUPLICATE PRINT ATTEMPT</span>.
              </p>
              <div className="bg-rose/5 border border-rose/20 rounded-lg overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-rose/10">
                      <th className="px-1.5 py-1 text-left font-medium text-ink/80 uppercase tracking-widest">Order ID</th>
                      <th className="px-1.5 py-1 text-left font-medium text-ink/80 uppercase tracking-widest">Status</th>
                      <th className="px-1.5 py-1 text-left font-medium text-ink/80 uppercase tracking-widest">Printed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose/10">
                    {fraudWarningOrders.map(o => (
                      <tr key={o.id}>
                        <td className="px-1.5 py-1 font-mono font-medium text-ink">{o.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-1.5 py-1">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 font-medium uppercase text-[9px] rounded">{o.status}</span>
                        </td>
                        <td className="px-1.5 py-1 text-ink/90 font-mono">
                          {o.printed_at ? new Date(o.printed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-ink/80 text-center">
                Hubungi supervisor jika Anda yakin perlu mencetak ulang label ini.
              </p>
            </div>

            {/* Footer */}
            <div className="px-1.5 py-1 bg-ink/5 flex justify-end gap-3">
              <button
                onClick={() => setIsFraudWarningOpen(false)}
                className="px-5 py-2 text-[10px] uppercase font-medium tracking-widest bg-ink text-white rounded-sm hover:bg-ink/80 transition-colors"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
}
