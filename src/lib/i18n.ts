import { id } from '@/i18n/dictionaries/id';
import { en } from '@/i18n/dictionaries/en';

export type Locale = 'ID' | 'EN';
export type Dictionary = typeof id;

// For Client Components: The user should pass the dictionary down as props,
// or if necessary, determine it purely by URL:
export function getDictionaryByLocale(locale: Locale): Dictionary {
  if (locale === 'EN') return en;
  return id;
}
