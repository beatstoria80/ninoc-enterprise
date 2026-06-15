import React from 'react';
import { Order } from './types';

// Standalone Barcode Generator (Code 128)
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

export function BarcodeCode128({ value, width = 360, height = 60 }: { value: string; width?: number; height?: number }) {
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
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      {rects}
    </svg>
  );
}

// Function to format phone numbers to mask them like in the screenshot
function formatMaskedPhone(phone: string): string {
  if (!phone) return '-';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 8) return clean;
  const prefix = clean.substring(0, 4);
  const suffix = clean.substring(clean.length - 4);
  return `${prefix}-****-${suffix}`;
}

export function ShippingLabel({ order }: { order: Order }) {
  const trackingId = order.tracking_id || order.id.toUpperCase(); 
  const totalItems = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const totalWeight = (totalItems * 0.150).toFixed(0); // Mock weight
  
  const shipDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }); // Format like "15 Jun 2026"

  const receiverName = order.shipping_address?.name || 'Customer';
  const receiverPhone = order.shipping_address?.phone || '';
  const receiverAddress = order.shipping_address?.address || '';
  const receiverKelurahan = order.shipping_address?.province || ''; // mock
  const receiverKecamatan = order.shipping_address?.city || ''; // mock
  const receiverPostal = order.shipping_address?.postal_code || '';

  const shortItemsStr = order.order_items?.map(i => {
    // Simplify name
    let name = i.product_name || 'ITEM';
    name = name.toUpperCase();
    const size = i.size || 'ALL SIZE';
    return `${name} (SZ: ${size}) X${i.quantity}`;
  }).join(', ');

  const borderColor = '#000';
  const borderWidth = '2px';
  const fontFamily = "'Courier New', Courier, monospace";

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100mm',
      backgroundColor: 'white',
      color: 'black',
      fontFamily: fontFamily,
      boxSizing: 'border-box',
      border: `${borderWidth} solid ${borderColor}`,
      padding: '0',
      lineHeight: '1.4'
    }}>
      
      {/* 1. TOP HEADER (NINOC ARCHIVE | POS 1) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `${borderWidth} solid ${borderColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', fontWeight: '900', fontStyle: 'italic', fontFamily: 'Arial, sans-serif' }}>NINOC</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', paddingTop: '4px' }}>ARCHIVE</span>
        </div>
        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '2px', marginTop: '4px' }}>POS 1</div>
      </div>

      {/* 2. BARCODE SECTION */}
      <div style={{
        padding: '24px 16px',
        borderBottom: `${borderWidth} solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%', marginBottom: '12px' }}>
          <BarcodeCode128 value={trackingId} height={60} />
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '4px', // Wide spacing like in screenshot
          textAlign: 'center'
        }}>
          {trackingId}
        </div>
      </div>

      {/* 3. ADDRESS GRID (PENERIMA / PENGIRIM) */}
      <div style={{
        display: 'flex',
        borderBottom: `${borderWidth} solid ${borderColor}`,
      }}>
        {/* LEFT BOX: PENERIMA */}
        <div style={{
          flex: 1,
          borderRight: `${borderWidth} solid ${borderColor}`,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>PENERIMA / TO</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{receiverName}</div>
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>{formatMaskedPhone(receiverPhone)}</div>
          
          <div style={{ fontSize: '9px', textTransform: 'uppercase', lineHeight: '1.6' }}>
            {receiverAddress}, KEL. {receiverKelurahan}<br/>
            KEC. {receiverKecamatan}, {receiverPostal}
          </div>
        </div>

        {/* RIGHT BOX: PENGIRIM */}
        <div style={{
          flex: 1,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>PENGIRIM / FROM</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>NINOC STUDIO</div>
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>0821-1983-774</div>
          
          <div style={{ fontSize: '9px', textTransform: 'uppercase', lineHeight: '1.6' }}>
            KOTA BANDUNG<br/>
            JAWA BARAT<br/>
            40292
          </div>
        </div>
      </div>

      {/* 4. CONTENTS GRID (ISI PAKET / ORDER ID) */}
      <div style={{
        display: 'flex',
        borderBottom: `${borderWidth} solid ${borderColor}`,
      }}>
        {/* LEFT BOX: CONTENTS */}
        <div style={{
          flex: 1.2,
          borderRight: `${borderWidth} solid ${borderColor}`,
          padding: '12px',
        }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px', textDecoration: 'underline' }}>ISI PAKET / CONTENTS</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', lineHeight: '1.6' }}>
            {shortItemsStr}
          </div>
        </div>

        {/* RIGHT BOX: ORDER ID */}
        <div style={{
          flex: 0.8,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>ORDER ID</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px' }}>
            #{order.id.toUpperCase()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '9px' }}>
            <span>Qty: {totalItems}</span>
            <span>~{totalWeight}g</span>
          </div>
        </div>
      </div>

      {/* 5. FOOTER */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '8px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        <div style={{ color: '#666' }}>{shipDate}</div>
        <div style={{ letterSpacing: '1px' }}>NINOC ARCHIVE - BANDUNG, INDONESIA</div>
        <div style={{ color: '#999', fontSize: '10px' }}>FRAGILE</div>
      </div>

    </div>
  );
}
