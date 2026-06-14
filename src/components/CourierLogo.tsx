import React from 'react';

// SVGs inline untuk mencegah broken image / di block oleh CORS
const LOGO_SVGS: Record<string, React.ReactNode> = {
  jne: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <text x="5" y="22" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="24" fill="#003180" fontStyle="italic">JNE</text>
      <text x="60" y="22" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="24" fill="#E3000F" fontStyle="italic">EXPRESS</text>
      <rect x="5" y="26" width="50" height="4" fill="#E3000F" />
    </svg>
  ),
  sicepat: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="30" rx="4" fill="#E3000F" />
      <text x="50" y="20" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" fill="#FFFFFF" fontStyle="italic" textAnchor="middle">SiCepat</text>
    </svg>
  ),
  "j&t": (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="30" rx="0" fill="#E3000F" />
      <text x="50" y="21" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="#FFFFFF" textAnchor="middle">J&amp;T EXPRESS</text>
    </svg>
  ),
  jnt: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="30" rx="0" fill="#E3000F" />
      <text x="50" y="21" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="#FFFFFF" textAnchor="middle">J&amp;T EXPRESS</text>
    </svg>
  ),
  anteraja: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="30" rx="15" fill="#EE2C3C" />
      <text x="50" y="20" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" fill="#FFFFFF" textAnchor="middle">AnterAja</text>
    </svg>
  ),
  ninja: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="30" rx="4" fill="#C51C2A" />
      <text x="50" y="20" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="#FFFFFF" fontStyle="italic" textAnchor="middle">ninjaVAN</text>
    </svg>
  ),
  gosend: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="30" rx="15" fill="#00AA13" />
      <text x="50" y="20" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" fill="#FFFFFF" textAnchor="middle">GoSend</text>
    </svg>
  ),
  grabexpress: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="30" rx="15" fill="#00B14F" />
      <text x="50" y="20" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#FFFFFF" textAnchor="middle">GrabExpress</text>
    </svg>
  ),
  pos: (
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <text x="5" y="22" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="22" fill="#F36F21" fontStyle="italic">POS</text>
      <text x="55" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="18" fill="#000000">Indonesia</text>
    </svg>
  )
};

export const COURIER_LOGOS = LOGO_SVGS;

export function getCourierSvg(courierName: string | null | undefined): React.ReactNode | null {
  if (!courierName) return null;
  const key = courierName.toLowerCase().trim();
  for (const [k, svg] of Object.entries(LOGO_SVGS)) {
    if (key.includes(k)) return svg;
  }
  return null;
}

interface CourierLogoProps {
  courier: string;
  className?: string;
  forceBlackForPrint?: boolean;
}

export default function CourierLogo({ courier, className = "", forceBlackForPrint = false }: CourierLogoProps) {
  const svgContent = getCourierSvg(courier);
  
  if (!svgContent) {
    // Fallback Text jika tidak ada SVG match
    return (
      <span className={`font-semibold uppercase ${className} inline-flex items-center justify-center px-2 py-0.5 bg-ink/5 border border-ink/10 rounded-sm text-ink text-[10px]`}>
        {courier}
      </span>
    );
  }

  return (
    <div 
      className={`inline-block ${className}`}
      style={forceBlackForPrint ? { filter: 'grayscale(100%) brightness(0)' } : undefined}
    >
      {svgContent}
    </div>
  );
}
