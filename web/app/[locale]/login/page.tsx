'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { Routes } from '@/app/routes/routes.enum';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error: authError, isLoading } = useAuth();
  const t = useTranslations('Login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      window.location.href = Routes.HOME;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-100 via-white to-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-yellow-700 mb-6 text-center">{t('title')}</h1>

        {authError && (
          <p data-testid="error-modal" className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center font-semibold">
            {authError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900 placeholder-gray-400"
          />

          <input
            name="password"
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900 placeholder-gray-400"
          />

          <button name="submit-button" type="submit" disabled={isLoading} className="bg-yellow-700 text-white p-3 rounded font-semibold hover:bg-yellow-600 transition-colors">
            {isLoading ? t('loading') : t('title')}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500">
          {t('registerLabel')}{' '}
          <a href={Routes.REGISTER} className="text-yellow-600 hover:text-yellow-500 font-semibold">
            {t('register')}
          </a>
        </p>
      </div>
    </div>
  );
}
