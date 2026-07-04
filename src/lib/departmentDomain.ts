/**
 * @file departmentDomain.ts
 * @description Single Source of Truth (SSOT) for NINOC Enterprise 3-Pillar Department Classification,
 * Keyword Matching, Variant Presets, and Regulatory Rules.
 *
 * Designed to replace scattered inline string matching across Admin Dashboard, Homepage,
 * Shipping API, and Policy Engines.
 */

export type DepartmentPillar = 'APPAREL' | 'OBJECTS' | 'PANTRY';

export interface DepartmentConfig {
  readonly id: DepartmentPillar;
  readonly code: string;
  readonly name: string;
  readonly nameId: string;
  readonly subtitle: string;
  readonly isPerishable: boolean;
  readonly returnAllowed: boolean;
  readonly defaultSizePreset: string[];
  readonly defaultColorLabel: string;
  readonly defaultColorPlaceholder: string;
  readonly keywords: readonly string[];
}

/**
 * Immutable Domain Configuration for Department Pillars
 */
export const DEPARTMENT_CONFIGS: Record<DepartmentPillar, DepartmentConfig> = {
  APPAREL: {
    id: 'APPAREL',
    code: 'APR-01',
    name: 'Apparel & Archive',
    nameId: 'Pakaian & Arsip Fashion',
    subtitle: 'Fashion · Garment · Footwear',
    isPerishable: false,
    returnAllowed: true,
    defaultSizePreset: ['S', 'M', 'L', 'XL', '2XL'],
    defaultColorLabel: 'Color Variant:',
    defaultColorPlaceholder: 'e.g. 100% Cotton / Heavyweight Washed Black',
    keywords: [
      'apparel', 'archive', 'fashion', 'garment', 'footwear', 'clothes', 'clothing',
      'pakaian', 'baju', 'kaos', 'celana', 'jaket', 'hoodie', 'shirt', 't-shirt',
      'pants', 'outerwear', 'sweatshirt', 'sepatu', 'aksesoris', 'atasan', 'bawahan'
    ] as const,
  },
  OBJECTS: {
    id: 'OBJECTS',
    code: 'OBJ-02',
    name: 'Home & Living',
    nameId: 'Peralatan Rumah & Homeware',
    subtitle: 'Homeware · Ceramics · Decor',
    isPerishable: false,
    returnAllowed: true,
    defaultSizePreset: ['REGULAR', 'SMALL', 'LARGE', 'SET OF 2', 'SET OF 4'],
    defaultColorLabel: 'Varian Model / Warna:',
    defaultColorPlaceholder: 'e.g. Ceramic Glaze / Stoneware Matte',
    keywords: [
      'objects', 'consumer', 'home', 'kitchen', 'utilities', 'collectibles',
      'ceramics', 'goods', 'homeware', 'lifestyle', 'keramik', 'piring', 'gelas',
      'botol', 'alat', 'rumah', 'mug', 'cup', 'tableware', 'decor', 'dekorasi', '2'
    ] as const,
  },
  PANTRY: {
    id: 'PANTRY',
    code: 'PTR-03',
    name: 'Pantry & Café',
    nameId: 'Pantry & F&B Roastery',
    subtitle: 'Specialty Coffee · Pastry · RTD Beverage',
    isPerishable: true,
    returnAllowed: false,
    defaultSizePreset: ['250G', '500G', '1000G', 'SINGLE PACK', 'BOX OF 6', 'BOX OF 12', '1 LITRE', 'REGULAR'],
    defaultColorLabel: 'Varian / Roast Profile:',
    defaultColorPlaceholder: 'e.g. Priangan West Java / Arabica Medium Roast',
    keywords: [
      'pantry', 'f&b', 'fnb', 'cafe', 'roastery', 'coffee', 'pastry', 'rtd', 'snack',
      'beverage', 'kopi', 'kue', 'makanan', 'minuman', 'beans', 'roast', 'food',
      'drinks', 'beans 250g', 'arabica', 'robusta', 'espresso', 'brew', '3'
    ] as const,
  },
} as const;

/**
 * High-performance string normalization for diacritic-safe keyword comparison.
 * Strips accents, lowercases, and removes special punctuation.
 */
export function normalizeDomainString(str?: string | null): string {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Universal Department Classifier
 * Accurately detects the department pillar from mixed metadata (id, slug, name, category).
 *
 * @param input - String keyword OR object containing department_id, category, slug, or name
 * @returns DepartmentPillar ('APPAREL' | 'OBJECTS' | 'PANTRY')
 */
export function classifyDepartment(
  input?: string | null | { department_id?: string | number; category?: string; slug?: string; name?: string; department?: string }
): DepartmentPillar {
  if (!input) return 'APPAREL';

  let combinedText = '';

  if (typeof input === 'string') {
    combinedText = normalizeDomainString(input);
  } else {
    // Explicit ID checks first (fastest path)
    const deptIdStr = input.department_id?.toString().trim();
    if (deptIdStr === '3' || deptIdStr === 'pantry') return 'PANTRY';
    if (deptIdStr === '2' || deptIdStr === 'objects') return 'OBJECTS';
    if (deptIdStr === '1' || deptIdStr === 'apparel') return 'APPAREL';

    combinedText = normalizeDomainString(
      `${input.department || ''} ${input.category || ''} ${input.slug || ''} ${input.name || ''}`
    );
  }

  // Check PANTRY keywords
  if (DEPARTMENT_CONFIGS.PANTRY.keywords.some((k) => combinedText.includes(k))) {
    return 'PANTRY';
  }

  // Check OBJECTS keywords
  if (DEPARTMENT_CONFIGS.OBJECTS.keywords.some((k) => combinedText.includes(k))) {
    return 'OBJECTS';
  }

  // Default to APPAREL (Core Fashion Pillar)
  return 'APPAREL';
}

/**
 * Quick Helper Predicates for Conditional UI/Backend Logic
 */
export function isFnBDepartment(input?: any): boolean {
  return classifyDepartment(input) === 'PANTRY';
}

export function isObjectsDepartment(input?: any): boolean {
  return classifyDepartment(input) === 'OBJECTS';
}

export function isFashionDepartment(input?: any): boolean {
  return classifyDepartment(input) === 'APPAREL';
}

/**
 * Returns configuration metadata for a given department input
 */
export function getDepartmentConfig(input?: any): DepartmentConfig {
  const pillar = classifyDepartment(input);
  return DEPARTMENT_CONFIGS[pillar];
}
