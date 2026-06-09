import { headers } from 'next/headers';
import { getDictionaryByLocale, Locale, Dictionary } from './i18n';

// For Server Components Only
export function getDictionary(): Dictionary {
  // Try reading from headers (injected by middleware)
  const headersList = headers();
  const locale = headersList.get('x-next-locale') as Locale || 'ID';
  
  return getDictionaryByLocale(locale);
}
