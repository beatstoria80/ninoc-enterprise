import { usePathname } from 'next/navigation';
import { id } from '@/i18n/dictionaries/id';
import { en } from '@/i18n/dictionaries/en';

export function useDictionary() {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  return isEn ? en : id;
}
