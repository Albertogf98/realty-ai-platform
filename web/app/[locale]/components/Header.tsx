'use client';

import Link from 'next/link';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from 'next-intl';
import HeaderSkeleton from './HeaderSkeleton';
import { useRouter } from 'next/navigation';
import { Routes } from '@/app/routes/routes.enum';
import { useLocale } from 'next-intl';

export default function Header() {
  const t = useTranslations('Header');
  const locale = useLocale();
  const { user, isLoading } = useUser();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();

    if (user) window.location.href = Routes.LOGIN;

    router.push(Routes.LOGIN);
  };

  if (isLoading) return <HeaderSkeleton />;

  return (
    <header className="bg-gradient-to-r from-yellow-200 via-white to-gray-200 shadow-md py-4 px-6 flex justify-between items-center border-b border-gray-300 sticky top-0 z-50">
      <Link href={Routes.HOME} aria-label={t('title')}>
        <span className="text-2xl font-extrabold text-yellow-700 hover:text-yellow-600 transition-colors">{t('title')}</span>
      </Link>

      <nav aria-label={locale === 'es' ? 'Navegación principal' : 'Main navigation'} className="flex gap-6 items-center text-gray-800 font-semibold">
        {!user && (
          <>
            <Link data-testid="login" href={Routes.LOGIN}>
              {t('login')}
            </Link>
            <Link data-testid="register" href={Routes.REGISTER}>
              {t('register')}
            </Link>
          </>
        )}

        {user && (
          <>
            {user.role === 'USER' && (
              <Link data-testid="favorites" href={Routes.FAVORITES}>
                {t('favorites')}
              </Link>
            )}

            <Link data-testid="messages" href={Routes.MESSAGES}>
              {t('messages')}
            </Link>

            {user.role === 'AGENT' && (
              <>
                <Link data-testid="appointments" href={Routes.APPOINTMENTS}>
                  {t('appointments')}
                </Link>
                <Link data-testid="newProperty" href={Routes.NEW_PROPERTY}>
                  {t('newProperty')}
                </Link>
              </>
            )}

            <button data-testid="logout" onClick={handleLogout}>
              {t('logout')}
            </button>
          </>
        )}

        <LanguageSwitcher />
      </nav>
    </header>
  );
}
