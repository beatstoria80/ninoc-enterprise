import React from 'react';

// URL Logo Resmi dengan Background Transparan (Resolusi Tinggi)
export const COURIER_LOGOS: Record<string, string> = {
  'jne': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'sicepat': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Logo-SiCepat.png',
  'j&t': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Logo_J%26T_Express.png',
  'jnt': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Logo_J%26T_Express.png',
  'anteraja': 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Anteraja.png',
  'ninja': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Ninja_Van_Logo.png',
  'pos': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Pos_Indonesia_logo.png',
};

export function getCourierLogoUrl(courierName: string | null | undefined): string | null {
  if (!courierName) return null;
  const key = courierName.toLowerCase().trim();
  for (const [k, url] of Object.entries(COURIER_LOGOS)) {
    if (key.includes(k)) return url;
  }
  return null;
}

interface CourierLogoProps {
  courier: string;
  className?: string;
  forceBlackForPrint?: boolean;
}

export default function CourierLogo({ courier, className = "", forceBlackForPrint = false }: CourierLogoProps) {
  const url = getCourierLogoUrl(courier);
  
  if (!url) {
    // Fallback jika logo tidak ditemukan
    return (
      <span className={`font-semibold uppercase ${className}`}>
        {courier}
      </span>
    );
  }

  // forceBlackForPrint menggunakan trik brightness(0) agar logo warna menjadi hitam solid (cocok untuk label resi).
  // Di UI biasa, logo akan tampil dengan warna original sesuai hukum hak cipta.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={url} 
      alt={`${courier} logo`} 
      className={`object-contain ${className}`}
      style={forceBlackForPrint ? { filter: 'brightness(0)' } : undefined}
    />
  );
}
