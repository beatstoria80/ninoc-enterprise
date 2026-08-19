'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface LanguageSwitcherProps {
  currentLang: string;
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLanguageChange = (lang: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', lang);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
          currentLang === 'en' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        ENG
      </button>
      <button
        onClick={() => handleLanguageChange('id')}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
          currentLang === 'id' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        ID
      </button>
    </div>
  );
}
