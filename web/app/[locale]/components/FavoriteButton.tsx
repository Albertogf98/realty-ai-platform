'use client';

import { Heart, HeartOff } from 'lucide-react';
import { useFavorites } from '@/app/hooks/useFavorites';
import { useTranslations } from 'next-intl';

export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const { toggleFavorite, favorites } = useFavorites();
  const t = useTranslations('PropertyDetails');
  const isFavorite = favorites.some(fav => fav.id === propertyId);

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t('removeFavorite') : t('addFavorite')}
      onClick={() => toggleFavorite(propertyId)}
      className="p-2 rounded-full bg-white shadow-md hover:bg-yellow-100 transition"
    >
      {isFavorite ? <Heart className="text-red-500 w-6 h-6" /> : <HeartOff className="w-6 h-6" />}
    </button>
  );
}
