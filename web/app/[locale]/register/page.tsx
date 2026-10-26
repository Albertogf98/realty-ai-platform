'use client';

import { useRegister } from '@/app/hooks/useAuth';
import { Routes } from '@/app/routes/routes.enum';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/hooks/useUser';
import { useEffect, useState } from 'react';
import Loading from '../components/Loading';

export default function Register() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const t = useTranslations('Register');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nuevo estado
  const [name, setName] = useState('');
  const [passwordError, setPasswordError] = useState(''); // Error de confirmación

  const { mutate: register, isPending, isError, error } = useRegister();

  useEffect(() => {
    if (!isUserLoading && user) router.replace('/');
  }, [user, isUserLoading, router]);

  if (isUserLoading) return <Loading />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError(t('passwordsDoNotMatch'));
      return;
    }

    setPasswordError('');

    register(
      { email, password, name, role: 'USER' },
      {
        onSuccess: () => {
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          router.push(Routes.LOGIN);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-100 via-white to-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-yellow-700 mb-6 text-center">{t('title')}</h1>

        {isError && <p className="error-message bg-red-100 text-red-700 p-2 rounded mb-4 text-center font-semibold">{error?.response?.data?.message || 'Something went wrong'}</p>}

        {passwordError && <p className="error-message bg-red-100 text-red-700 p-2 rounded mb-4 text-center font-semibold">{passwordError}</p>}

        <form autoComplete="off" data-testid="register-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="name"
            autoComplete="new-name"
            data-testid="name-input"
            type="text"
            placeholder={t('name') || 'Nombre'}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900 placeholder-gray-400"
          />

          <input
            name="email"
            autoComplete="new-email"
            data-testid="email-input"
            type="email"
            placeholder={t('email') || 'Email'}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900 placeholder-gray-400"
          />

          <input
            name="password"
            autoComplete="new-password"
            data-testid="password-input"
            type="password"
            placeholder={t('password') || 'Contraseña'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900 placeholder-gray-400"
          />

          <input
            name="confirmPassword"
            autoComplete="new-password"
            data-testid="confirm-password-input"
            type="password"
            placeholder={t('confirmPassword') || 'Confirma la contraseña'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900 placeholder-gray-400"
          />

          <button
            name="submit-button"
            data-testid="register-submit"
            type="submit"
            disabled={isPending}
            className="bg-yellow-700 text-white p-3 rounded font-semibold hover:bg-yellow-600 transition-colors"
          >
            {isPending ? t('loading') || 'Registrando...' : t('title') || 'Registrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500">
          {t('loginLabel') || '¿Ya tienes cuenta?'}{' '}
          <a data-testid="login-link" href={Routes.LOGIN} className="text-yellow-600 hover:text-yellow-500 font-semibold">
            {t('login') || 'Inicia sesión'}
          </a>
        </p>
      </div>
    </div>
  );
}
