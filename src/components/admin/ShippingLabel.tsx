import React from 'react';
import { Order } from './types';
import { QRCodeSVG } from 'qrcode.react';

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

// ============ COURIER LOGO MAPPING ============
const COURIER_LOGOS: Record<string, string> = {
  'jne': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'jne reg': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'jne yes': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'jne oke': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'sicepat': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Logo-SiCepat.png',
  'sicepat best': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Logo-SiCepat.png',
  'sicepat reg': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Logo-SiCepat.png',
  'j&t': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Logo_J%26T_Express.png',
  'j&t express': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Logo_J%26T_Express.png',
  'anteraja': 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Anteraja.png',
  'pos': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Pos_Indonesia_logo.png',
  'pos indonesia': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Pos_Indonesia_logo.png',
  'ninja': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Ninja_Van_Logo.png',
  'ninja express': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Ninja_Van_Logo.png',
};

export function getCourierLogo(courier: string | null): string | null {
  if (!courier) return null;
  const key = courier.toLowerCase().trim();
  for (const [k, v] of Object.entries(COURIER_LOGOS)) {
    if (key.includes(k)) return v;
  }
  return null;
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
  const courierLogo = getCourierLogo(order.courier);
  const trackingId = order.tracking_id || '';
  const totalItems = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const totalWeight = totalItems * 300; // est. 300g per item

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '10cm',
      height: '8cm',
      fontFamily: "'Courier New', 'Consolas', monospace",
      fontSize: '9px',
      backgroundColor: 'white',
      color: 'black',
      padding: '0',
      boxSizing: 'border-box',
      border: '2px solid black',
      overflow: 'hidden',
      lineHeight: 1.3
    }}>
      {/* ROW 1 — Header: NINOC brand + Courier logo/name + Service */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        borderBottom: '2px solid black',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', fontStyle: 'italic', letterSpacing: '1px' }}>NINOC</span>
          <span style={{ fontSize: '8px', color: '#666' }}>ARCHIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {courierLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={courierLogo} alt={courierInfo.name} style={{ height: '20px', objectFit: 'contain' }} />
          )}
          {!courierLogo && (
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{courierInfo.name}</span>
          )}
          <span style={{
            fontSize: '9px',
            fontWeight: 'bold',
            backgroundColor: 'black',
            color: 'white',
            padding: '2px 6px',
            letterSpacing: '1px'
          }}>{courierInfo.service}</span>
        </div>
      </div>

      {/* ROW 2 — Barcode + Tracking Number */}
      <div style={{
        padding: '8px 6px',
        borderBottom: '2px solid black',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
      }}>
        {trackingId ? (
          <>
            <BarcodeCode128 value={trackingId} width={340} height={45} />
            <div style={{
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '3px',
              marginTop: '4px'
            }}>{trackingId}</div>
          </>
        ) : (
          <div style={{
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '12px 0',
            color: '#999',
            letterSpacing: '1px',
            border: '2px dashed #ccc',
            width: '80%'
          }}>AWAITING TRACKING NUMBER</div>
        )}
      </div>

      {/* ROW 3 — Penerima + Pengirim (side by side) */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid black',
        flex: 1.2
      }}>
        {/* Penerima (larger, left) */}
        <div style={{
          flex: 3,
          padding: '6px 8px',
          borderRight: '2px solid black',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginBottom: '4px',
            backgroundColor: '#e0e0e0',
            padding: '2px 4px',
            display: 'inline-block',
            alignSelf: 'flex-start'
          }}>PENERIMA / TO</div>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
            {order.shipping_address?.name?.toUpperCase()}
          </div>
          <div style={{ fontSize: '10px', marginTop: '2px' }}>
            {order.shipping_address?.phone ? (
              order.shipping_address.phone.length >= 8
                ? order.shipping_address.phone.slice(0, 4) + '-****-' + order.shipping_address.phone.slice(-4)
                : order.shipping_address.phone
            ) : ''}
          </div>
          <div style={{ fontSize: '9px', marginTop: '4px', wordBreak: 'break-word', overflow: 'hidden' }}>
            {order.shipping_address?.address}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '2px' }}>
            {order.shipping_address?.city}, {order.shipping_address?.province || ''} {order.shipping_address?.postal_code}
          </div>
        </div>
        {/* Pengirim (smaller, right) */}
        <div style={{
          flex: 2,
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginBottom: '4px',
            backgroundColor: '#e0e0e0',
            padding: '2px 4px',
            display: 'inline-block',
            alignSelf: 'flex-start'
          }}>PENGIRIM / FROM</div>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '2px' }}>NINOC STUDIO</div>
          <div style={{ fontSize: '9px', marginTop: '2px' }}>0812-XXXX-XXXX</div>
          <div style={{ fontSize: '9px', marginTop: '4px' }}>Bandung, Jawa Barat</div>
          <div style={{ fontWeight: 'bold', fontSize: '9px' }}>40115</div>
        </div>
      </div>

      {/* ROW 4 — Package Info + Order ID */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid black',
        flex: 0.8
      }}>
        {/* Isi Paket */}
        <div style={{
          flex: 3,
          padding: '6px 8px',
          borderRight: '2px solid black',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>ISI PAKET / CONTENTS</div>
          {order.order_items?.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{ fontSize: '9px' }}>
              {item.product_name} {item.size ? `(${item.size})` : ''} ×{item.quantity}
            </div>
          ))}
          {(order.order_items?.length || 0) > 3 && (
            <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>+{(order.order_items?.length || 0) - 3} item lainnya</div>
          )}
        </div>
        {/* Order ID + Weight */}
        <div style={{
          flex: 2,
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '4px' }}>ORDER ID</div>
          <QRCodeSVG value={order.id.toUpperCase()} size={44} level="M" />
          <div style={{ fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px', marginTop: '6px' }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', fontSize: '8px', fontWeight: 'bold' }}>
            <span>Qty: {totalItems}</span>
            <span>~{totalWeight}g</span>
          </div>
        </div>
      </div>

      {/* ROW 5 — Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        fontSize: '8px',
        color: '#444'
      }}>
        <span>{new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span style={{ letterSpacing: '0.5px' }}>NINOC ARCHIVE • BANDUNG, INDONESIA</span>
        <span style={{
          fontWeight: 'bold',
          backgroundColor: 'black',
          color: 'white',
          padding: '1px 4px',
          fontSize: '8px'
        }}>FRAGILE</span>
      </div>
    </div>
  );
}
