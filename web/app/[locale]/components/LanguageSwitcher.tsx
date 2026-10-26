'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams?.toString();
  const queryString = qs ? `?${qs}` : '';

  const currentLocale = useLocale();
  const segments = pathname.split('/').filter(Boolean);
  const restPath = segments.slice(1).join('/');

  const [open, setOpen] = useState(false);

  const handleLocaleChange = (locale: string) => {
    const href = restPath ? `/${locale}/${restPath}${queryString}` : `/${locale}${queryString}`;
    router.replace(href);
    setOpen(false);
  };

  const currentLabel = locales.find(l => l.code === currentLocale)?.label || 'EN';

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex justify-center w-full px-4 py-2 bg-gray-100 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
      >
        {currentLabel}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {locales.map(locale => {
              const isActive = currentLocale === locale.code;
              return (
                <button
                  key={locale.code}
                  onClick={() => handleLocaleChange(locale.code)}
                  className={`block w-full text-left px-4 py-2 text-sm ${isActive ? 'bg-yellow-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {locale.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
