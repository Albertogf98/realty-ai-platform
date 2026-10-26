'use client';

import { useTranslations } from 'next-intl';

export default function LoadingError() {
  const t = useTranslations('Common');

  return (
    <div className="flex justify-center items-center h-full p-4">
      <p className="text-yellow-700 font-semibold animate-pulse">{t('loadingError')}</p>
    </div>
  );
}
