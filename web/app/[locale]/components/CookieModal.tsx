'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Routes } from '@/app/routes/routes.enum';
import { useTranslations } from 'next-intl';

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('Cookies');

  useEffect(() => {
    setMounted(true);
    const hasAccepted = document.cookie.includes('cookiesAccepted');
    setShow(!hasAccepted);
  }, []);

  const acceptCookies = () => {
    document.cookie = 'cookiesAccepted=true; path=/; max-age=31536000';
    setShow(false);
  };

  const rejectCookies = () => {
    document.cookie = 'cookiesAccepted=false; path=/; max-age=31536000';
    setShow(false);
  };

  if (!mounted || !show) return null;

  return (
    <div data-testid="cookies" role="dialog" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-t-xl bg-white p-6 shadow-lg sm:rounded-xl sm:mb-6">
        <h2 className="mb-2 text-lg font-semibold">🍪 Cookies</h2>

        <p className="mb-4 text-sm text-gray-600">
          {t.rich('description', {
            privacyPolicy: chunks => (
              <Link href={Routes.PRIVACY_POLICY} className="text-blue-600 underline">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <div className="flex gap-2">
          <button data-testid="cookies-accept" onClick={acceptCookies} className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            {t('accept')}
          </button>

          <button data-testid="cookies-reject" onClick={rejectCookies} className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 transition hover:bg-gray-400">
            {t('reject')}
          </button>
        </div>
      </div>
    </div>
  );
}
