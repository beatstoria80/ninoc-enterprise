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
      width: '100mm',
      minHeight: '150mm', // Standard thermal size (A6) or auto
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: 'white',
      color: 'black',
      padding: '0',
      boxSizing: 'border-box',
      border: '2px solid black',
      overflow: 'hidden',
    }}>
      {/* HEADER: Brand & Courier */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '2px solid black',
        height: '45px',
        position: 'relative'
      }}>
        {/* DUPLICATE WATERMARK */}
        {(order.print_count || 0) > 0 && (
          <div style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%) rotate(-30deg)',
            fontSize: '48px',
            fontWeight: '900',
            color: 'rgba(0,0,0,0.1)',
            border: '8px solid rgba(0,0,0,0.1)',
            padding: '10px 20px',
            textTransform: 'uppercase',
            letterSpacing: '5px',
            zIndex: 10,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}>
            REPRINT
            <div style={{ fontSize: '14px', textAlign: 'center', marginTop: '10px', letterSpacing: '2px' }}>
              OLEH: {order.last_printed_by || 'ADMIN'}
            </div>
          </div>
        )}
        <div style={{ 
          flex: 1, 
          padding: '0 12px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          backgroundColor: 'black',
          color: 'white'
        }}>
          <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1 }}>NINOC</span>
          <span style={{ fontSize: '7px', fontWeight: '600', letterSpacing: '3px', opacity: 0.8 }}>NINOC STUDIO</span>
        </div>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          padding: '0 12px',
          gap: '8px' 
        }}>
          {courierLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={courierLogo} alt={courierInfo.name} style={{ height: '18px', objectFit: 'contain', filter: 'grayscale(100%) contrast(120%)' }} />
          ) : (
            <span style={{ fontSize: '12px', fontWeight: '800' }}>{courierInfo.name}</span>
          )}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e5e5' }} />
          <span style={{
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '0.5px'
          }}>{courierInfo.service}</span>
        </div>
      </div>

      {/* TRACKING BARCODE */}
      <div style={{
        padding: '16px 12px',
        borderBottom: '2px solid black',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {trackingId ? (
          <>
            <BarcodeCode128 value={trackingId} width={340} height={50} />
            <div style={{
              fontWeight: '800',
              fontSize: '14px',
              letterSpacing: '4px',
              fontFamily: "'Courier New', monospace",
              marginTop: '8px'
            }}>{trackingId}</div>
          </>
        ) : (
          <div style={{
            fontWeight: '700',
            fontSize: '12px',
            padding: '16px 0',
            color: '#999',
            letterSpacing: '2px',
            border: '2px dashed #e5e5e5',
            width: '100%',
            textAlign: 'center'
          }}>AWAITING TRACKING ID</div>
        )}
      </div>

      {/* RECIPIENT & SENDER */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid black',
        flex: 1
      }}>
        {/* RECIPIENT */}
        <div style={{
          flex: 1.6,
          padding: '12px',
          borderRight: '2px solid black',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: '800',
            letterSpacing: '1px',
            marginBottom: '8px',
            backgroundColor: 'black',
            color: 'white',
            padding: '3px 8px',
            display: 'inline-block',
            alignSelf: 'flex-start',
            borderRadius: '2px'
          }}>TO / PENERIMA</div>
          
          <div style={{ fontWeight: '900', fontSize: '15px', textTransform: 'uppercase', lineHeight: 1.1 }}>
            {order.shipping_address?.name}
          </div>
          
          <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px', fontFamily: "'Courier New', monospace" }}>
            {order.shipping_address?.phone ? (
              order.shipping_address.phone.length >= 8
                ? order.shipping_address.phone.slice(0, 4) + '-****-' + order.shipping_address.phone.slice(-4)
                : order.shipping_address.phone
            ) : '-'}
          </div>
          
          <div style={{ fontSize: '11px', fontWeight: '500', marginTop: '8px', lineHeight: 1.4, color: '#333' }}>
            {order.shipping_address?.address}
          </div>
          
          <div style={{ fontWeight: '800', fontSize: '11px', marginTop: '6px', textTransform: 'uppercase' }}>
            {order.shipping_address?.city}, {order.shipping_address?.province}
          </div>
          <div style={{ fontWeight: '900', fontSize: '13px', marginTop: '2px', letterSpacing: '1px' }}>
            {order.shipping_address?.postal_code}
          </div>
        </div>

        {/* SENDER */}
        <div style={{
          flex: 1,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: '800',
            letterSpacing: '1px',
            marginBottom: '8px',
            border: '2px solid black',
            padding: '1px 6px',
            display: 'inline-block',
            alignSelf: 'flex-start',
            borderRadius: '2px'
          }}>FROM / PENGIRIM</div>
          
          <div style={{ fontWeight: '800', fontSize: '11px' }}>NINOC STUDIO</div>
          <div style={{ fontSize: '9px', fontWeight: '600', marginTop: '2px', fontFamily: "'Courier New', monospace", color: '#666' }}>0812-XXXX-XXXX</div>
          <div style={{ fontSize: '9px', fontWeight: '500', marginTop: '6px', lineHeight: 1.4, color: '#444' }}>Bandung, Jawa Barat<br/>Indonesia</div>
        </div>
      </div>

      {/* CONTENTS & DISPATCH QR */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid black',
      }}>
        {/* CONTENTS */}
        <div style={{
          flex: 1.6,
          padding: '12px',
          borderRight: '2px solid black',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px', color: '#666' }}>
            CONTENTS / ISI PAKET
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {order.order_items?.map((item, idx) => (
              <div key={idx} style={{ fontSize: '10px', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'uppercase', color: '#111' }}>{item.product_name} {item.size ? `[${item.size}]` : ''}</span>
                <span style={{ fontWeight: '800' }}>×{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR & META */}
        <div style={{
          flex: 1,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa'
        }}>
          <QRCodeSVG value={order.id.toUpperCase()} size={54} level="M" />
          <div style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '1px', marginTop: '8px', color: '#666' }}>ORDER ID</div>
          <div style={{ fontWeight: '900', fontSize: '11px', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '8px', fontSize: '9px', fontWeight: '800' }}>
            <span style={{ backgroundColor: '#e5e5e5', padding: '2px 6px', borderRadius: '2px' }}>{totalItems} PCS</span>
            <span style={{ backgroundColor: '#e5e5e5', padding: '2px 6px', borderRadius: '2px' }}>{totalWeight}g</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: 'black',
        color: 'white',
      }}>
        <span style={{ fontSize: '9px', fontWeight: '600', fontFamily: "'Courier New', monospace" }}>
          {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </span>
        <span style={{
          fontWeight: '900',
          fontSize: '10px',
          letterSpacing: '2px'
        }}>FRAGILE</span>
      </div>
    </div>
  );
}
