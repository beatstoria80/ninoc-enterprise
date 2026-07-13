import React, { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SafeImage({ src, alt, className, sizes, priority = false }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/[0.03] text-ink/20">
        <ImageOff size={24} />
        <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-widest">Image Unavailable</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-contain", className)}
      sizes={sizes || "(max-width: 768px) 50vw, 30vw"}
      priority={priority}
      unoptimized
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
