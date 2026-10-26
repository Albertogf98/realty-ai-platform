'use client';

import { useUser } from '@/app/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/client';
import { Favorite } from '../interfaces/favorite.interface';
import { AxiosResponse } from 'axios';

export function useFavorites() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch de favoritos
  const favoritesQuery = useQuery<Favorite[]>({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get<Favorite[]>(`favorites/user/${user.id}`);
      return res.data;
    },
    enabled: Boolean(user),
  });

  // Add favorito
  const addFavoriteMutation = useMutation<AxiosResponse, Error, string, { previousFavorites: Favorite[] | undefined }>({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('Not authenticated');
      return api.post('favorites', { userId: user.id, propertyId });
    },
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      const previousFavorites = queryClient.getQueryData<Favorite[]>(['favorites', user?.id]);

      // Optimistic update: añadimos el favorito localmente
      if (previousFavorites) {
        queryClient.setQueryData<Favorite[]>(
          ['favorites', user?.id],
          [
            ...previousFavorites,
            { property: { id: propertyId }, id: 'temp-id' } as Favorite, // id temporal
          ]
        );
      }

      return { previousFavorites };
    },
    onError: (_, __, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  // Remove favorito
  const removeFavoriteMutation = useMutation<AxiosResponse, Error, string, { previousFavorites: Favorite[] | undefined }>({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('Not authenticated');
      return api.delete(`favorites/${user.id}/${propertyId}`);
    },
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      const previousFavorites = queryClient.getQueryData<Favorite[]>(['favorites', user?.id]);

      queryClient.setQueryData<Favorite[]>(['favorites', user?.id], (old = []) => old.filter(fav => fav.property.id !== propertyId));

      return { previousFavorites };
    },
    onError: (_, __, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  // Toggle favorito
  const toggleFavorite = (propertyId: string) => {
    const isFav = favoritesQuery.data?.some(fav => fav.property.id === propertyId);
    if (isFav) removeFavoriteMutation.mutate(propertyId);
    else addFavoriteMutation.mutate(propertyId);
  };

  return {
    favorites: favoritesQuery.data?.map(fav => fav.property) || [],
    isLoading: favoritesQuery.isLoading,
    error: favoritesQuery.error,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    toggleFavorite,
  };
}
