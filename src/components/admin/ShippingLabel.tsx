import React from 'react';
import { Order } from './types';
import CourierLogo from '@/components/CourierLogo';

export function encodeCode128(text: string): number[] {
  const CODE128_B: Record<string, number> = {};
  for (let i = 0; i < 95; i++) CODE128_B[String.fromCharCode(32 + i)] = i;
  
  const patterns: number[][] = [
    [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
    [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
    [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
    [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
    [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
    [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
    [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
    [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
    [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
    [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
    [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
    [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
    [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
    [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
    [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
    [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
    [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
    [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
    [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
    [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
    [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
    [2,1,1,2,3,2],[2,3,3,1,1,1,2]
  ];
  
  const startCode = 104; // Start B
  const bars: number[] = [...patterns[startCode]];
  let checksum = startCode;
  
  for (let i = 0; i < text.length; i++) {
    const charVal = CODE128_B[text[i]] ?? 0;
    bars.push(...patterns[charVal]);
    checksum += charVal * (i + 1);
  }
  
  bars.push(...patterns[checksum % 103]);
  bars.push(...patterns[106]); // Stop
  
  return bars;
}

export function BarcodeCode128({ value, width = 280, height = 50 }: { value: string; width?: number; height?: number }) {
  if (!value) return null;
  const bars = encodeCode128(value);
  const totalUnits = bars.reduce((s, b) => s + b, 0);
  const unitW = width / totalUnits;
  
  let x = 0;
  const rects: React.ReactElement[] = [];
  bars.forEach((w, i) => {
    if (i % 2 === 0) {
      rects.push(<rect key={i} x={x} y={0} width={w * unitW} height={height} fill="black" />);
    }
    x += w * unitW;
  });
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {rects}
    </svg>
  );
}

export function getCourierService(courier: string | null): { name: string; service: string } {
  if (!courier) return { name: 'STANDARD', service: 'REG' };
  const parts = courier.split(' ');
  return {
    name: parts[0]?.toUpperCase() || 'STANDARD',
    service: parts.slice(1).join(' ').toUpperCase() || 'REG'
  };
}

export function ShippingLabel({ order }: { order: Order }) {
  const courierInfo = getCourierService(order.courier);
  const trackingId = order.tracking_id || 'JX9689052297'; // default to something so it looks like the reference if empty
  const totalItems = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const totalWeight = (totalItems * 0.150).toFixed(3); // mock 150g per item
  
  const shipDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, '-');

  const receiverName = order.shipping_address?.name || 'Customer';
  const rawPhone = order.shipping_address?.phone || '+628000000000';
  let receiverPhone = rawPhone;
  if (receiverPhone.length >= 8) {
    receiverPhone = receiverPhone.slice(0, 4) + 'XXXX' + receiverPhone.slice(-4);
  }
  const receiverAddress = order.shipping_address?.address || '';
  const receiverLocation = `${order.shipping_address?.city || ''}, ${order.shipping_address?.province || ''}`;
  
  const routingCode = `NNC-${(order.shipping_address?.postal_code || '10110').slice(0, 5)}`;
  const destinationHub = (order.shipping_address?.city || 'DESTINATION').toUpperCase();
  const isCOD = false; // set to false as our app uses Midtrans/VA mostly

  let shortItemsStr = order.order_items?.slice(0, 3).map(i => {
    const variants = [i.color, i.size].filter(Boolean).join(' / ');
    return `${i.product_name} (${variants || 'One Size'})`;
  }).join(', ') || '';
  if ((order.order_items?.length || 0) > 3) shortItemsStr += ', dll...';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      width: '100mm',
      height: '150mm',
      backgroundColor: 'white',
      color: 'black',
      fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* LEFT MARGIN BARCODE TEXT */}
      <div style={{
        width: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: '1px solid black'
      }}>
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '9px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          whiteSpace: 'nowrap'
        }}>
          {trackingId}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* HEADER SECTION */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 8px',
          borderBottom: '1px solid black',
          height: '45px'
        }}>
          <div style={{ flex: 1 }}>
             <CourierLogo courier={order.courier || 'J&T Express'} className="h-6" forceBlackForPrint={true} />
             <div style={{ fontSize: '8px', color: '#dd0000', fontWeight: 'bold' }}>(021) 80661888</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>
            {courierInfo.service}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${trackingId}`} alt="QR Code" style={{ width: '36px', height: '36px' }} />
          </div>
        </div>

        {/* SENDER INFO */}
        <div style={{ padding: '6px 8px', borderBottom: '1px dotted black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <div><span style={{ fontWeight: 'bold' }}>Pengirim :</span> NINOC ENTERPRISE</div>
            <div>(+62)812-XXXX-XXXX</div>
          </div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase' }}>
            JAWA BARAT, BANDUNG
          </div>
        </div>

        {/* RECEIVER INFO */}
        <div style={{ padding: '6px 8px', borderBottom: '1px solid black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <div><span style={{ fontWeight: 'bold' }}>Penerima :</span> {receiverName}</div>
            <div>{receiverPhone}</div>
          </div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>
            {receiverLocation}
          </div>
          {/* RECEIVER ADDRESS */}
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 'normal', 
            lineHeight: '1.3',
            textTransform: 'capitalize' 
          }}>
            {receiverAddress}
          </div>
        </div>

        {/* WEIGHT & DATE */}
        <div style={{ display: 'flex', fontSize: '9px', borderBottom: '1px solid black' }}>
          <div style={{ flex: 1, padding: '4px 8px', borderRight: '1px solid black' }}>
            Weight : {totalWeight} KG
          </div>
          <div style={{ flex: 1, padding: '4px 8px' }}>
            Ship : {shipDate}
          </div>
        </div>

        {/* ITEMS & COD WATERMARK */}
        <div style={{ 
          padding: '6px 8px', 
          fontSize: '10px', 
          position: 'relative', 
          minHeight: '35px',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            Jumlah : {totalItems}pcs, Barang : {shortItemsStr}
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '36px',
            fontWeight: '900',
            color: 'rgba(0,0,0,0.4)',
            letterSpacing: '2px',
            zIndex: 1
          }}>
            {isCOD ? 'COD' : 'NON-COD'}
          </div>
        </div>

        {/* DESTINATION ROUTING BOX */}
        <div style={{
          backgroundColor: 'black',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '4px 0',
          letterSpacing: '1px'
        }}>
          {destinationHub}
        </div>

        {/* ROUTING CODE */}
        <div style={{
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: '900',
          letterSpacing: '-1px',
          padding: '8px 0 4px',
          lineHeight: '1'
        }}>
          {routingCode}
        </div>

        {/* MAIN BARCODE */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: '1px solid black'
        }}>
          <BarcodeCode128 value={trackingId} width={300} height={60} />
          <div style={{
            fontSize: '16px',
            fontWeight: '900',
            marginTop: '4px',
            letterSpacing: '2px'
          }}>
            {trackingId}
          </div>
          <div style={{ fontSize: '7px', marginTop: '4px' }}>
            Syarat dan ketentuan pengiriman dapat dilihat pada website ninoc.store
          </div>
        </div>

        {/* ORDER ID ROW */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          fontWeight: 'bold',
          padding: '4px 8px',
          borderBottom: '2px solid black'
        }}>
          <div>Order Id : {order.id.toUpperCase()}</div>
        </div>

        {/* ITEMS TABLE */}
        <div style={{ padding: '6px 8px', fontSize: '8px', borderBottom: '1px solid black' }}>
          <div style={{ color: '#666', marginBottom: '2px' }}>In transit by: {shipDate}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid black', textAlign: 'left' }}>
                <th style={{ paddingBottom: '2px', width: '50%' }}>Product Name</th>
                <th style={{ paddingBottom: '2px' }}>SKU</th>
                <th style={{ paddingBottom: '2px', textAlign: 'right' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.slice(0, 4).map((item, idx) => (
                <tr key={idx} style={{ verticalAlign: 'top' }}>
                  <td style={{ paddingTop: '2px', paddingRight: '4px' }}>{item.product_name}</td>
                  <td style={{ paddingTop: '2px' }}>{[item.color, item.size].filter(Boolean).join(' / ') || '-'}</td>
                  <td style={{ paddingTop: '2px', textAlign: 'right' }}>{item.quantity}</td>
                </tr>
              ))}
              {(order.order_items?.length || 0) > 4 && (
                <tr style={{ verticalAlign: 'top' }}>
                  <td colSpan={3} style={{ paddingTop: '4px', fontStyle: 'italic', color: '#555' }}>
                    + {(order.order_items?.length || 0) - 4} produk lainnya... (Lihat Packing Slip)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid black', paddingTop: '2px', marginTop: '4px' }}>
            Qty Total: {totalItems}
          </div>
        </div>

        {/* FOOTER (PLATFORM LOGOS) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          flex: 1 // push to bottom
        }}>
          <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-1px' }}>ninoc.store</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
             <span style={{ fontSize: '14px', fontWeight: '800' }}>Shop</span>
          </div>
          <div style={{ fontSize: '6px', textAlign: 'right' }}>
            Order ID: {order.id.toUpperCase()}<br/>
            Printed: {new Date().toLocaleString('id-ID')}
          </div>
        </div>

      </div>

      {/* RIGHT MARGIN BARCODE TEXT */}
      <div style={{
        width: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeft: '1px solid black'
      }}>
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '9px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          whiteSpace: 'nowrap'
        }}>
          {trackingId}
        </div>
      </div>

    </div>
  );
}
