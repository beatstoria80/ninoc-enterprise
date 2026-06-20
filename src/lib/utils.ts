import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getShippingSLA(createdAt: string | Date, courier: string | null) {
  const date = new Date(createdAt);
  
  // Use Asia/Jakarta time for processing logic
  const localDateStr = date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const localDate = new Date(localDateStr);
  const hour = localDate.getHours();
  
  const isInstant = courier?.toLowerCase().includes('instan') || courier?.toLowerCase().includes('gojek') || courier?.toLowerCase().includes('grab');

  if (isInstant && hour < 12) {
    return { label: 'Pickup Hari Ini (Instan)', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
  } else if (hour < 12) {
    return { label: 'Kirim Hari Ini', badgeClass: 'bg-rose/10 text-rose border-rose/20' };
  } else if (hour >= 12 && hour < 15) {
    return { label: 'Kirim Besok', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
  } else {
    return { label: 'Kirim Lusa', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
}
