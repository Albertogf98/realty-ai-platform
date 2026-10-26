'use client';

import { Heart, HeartOff } from 'lucide-react';
import { useFavorites } from '@/app/hooks/useFavorites';

export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const { toggleFavorite, favorites } = useFavorites();
  const isFavorite = favorites.some(fav => fav.id === propertyId);

  return (
    <button onClick={() => toggleFavorite(propertyId)} className="p-2 rounded-full bg-white shadow-md hover:bg-yellow-100 transition">
      {isFavorite ? <Heart className="text-red-500 w-6 h-6" /> : <HeartOff className="w-6 h-6" />}
    </button>
  );
}
