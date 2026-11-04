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
    <aside data-testid="cookies" aria-labelledby="cookie-banner-heading" className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        <h2 id="cookie-banner-heading" className="mb-2 text-lg font-semibold">
          🍪 Cookies
        </h2>

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
    </aside>
  );
}
