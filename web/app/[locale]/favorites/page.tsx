'use client';

import { useFavorites } from '@/app/hooks/useFavorites';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import Loading from '../components/Loading';
import LoadingError from '../components/LoadingError';
import { Property } from '@/app/interfaces/property.interface';
import AuthLayout from '../layouts/AuthLayout';
import { useState } from 'react';

export default function FavoritesPage() {
  const { favorites, isLoading, error, removeFavorite } = useFavorites();
  const t = useTranslations('Favorites');
  const locale = useLocale();

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  if (isLoading) return <Loading />;
  if (error) return <LoadingError />;

  const handleRemoveFavorite = (id: string) => {
    setRemovedIds(prev => new Set(prev).add(id));

    removeFavorite(id, {
      onError: () => {
        setRemovedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      },
    });
  };

  const visibleFavorites = favorites.filter(fav => !removedIds.has(fav.id));

  if (visibleFavorites.length === 0) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-3xl font-semibold mb-4">{t('myFavorites')}</h1>
          <p className="text-gray-500">{t('noFavorites')}</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout role="USER">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-8">{t('myFavorites')}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleFavorites.map((property: Property) => {
            const title = locale === 'en' ? property.title_en : property.title_es;

            return (
              <div
                key={property.id}
                className="relative bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-lg overflow-hidden flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-2xl"
              >
                <button
                  onClick={() => handleRemoveFavorite(property.id)}
                  className="absolute top-3 right-3 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:scale-110 transition-transform"
                  title={t('removeFavorite')}
                >
                  <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
                </button>

                {property.images?.[0] && (
                  <img
                    src={property.images.length > 0 ? property.images[0].url : '/default-property.png'}
                    alt={title}
                    className="h-52 w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                )}

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono select-all mb-2">ID: {property.id}</p>

                  <h2 className="text-xl font-semibold line-clamp-2">{title}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {property.city}, {property.state}
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400 font-bold mt-3 text-lg">{property.price.toLocaleString()} €</p>

                  <div className="mt-auto flex justify-between items-center pt-5">
                    <Link href={`/property/${property.id}`} className="text-yellow-600 dark:text-yellow-400 font-medium hover:underline">
                      {t('viewProperty')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthLayout>
  );
}
