'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/client';
import { User } from '../interfaces/user.interface';
import Cookies from 'js-cookie';

function useUser() {
  const query = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const userId = Cookies.get('userId');
      const token = Cookies.get('access_token');

      if (!userId || !token) return null;

      try {
        const response = await api.get<User>(`users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          const refreshToken = Cookies.get('refresh_token');

          if (!refreshToken) return null;

          const refreshResponse = await api.post('auth/refresh', { userId, refreshToken });
          const newAccessToken = refreshResponse.data.access_token;

          Cookies.set('access_token', newAccessToken);

          const retryResponse = await api.get<User>(`users/${userId}`, {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          });
          return retryResponse.data;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

function useAgents() {
  return useQuery<User[], Error>({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await api.get('users/agents');

      return res.data;
    },
  });
}

export { useUser, useAgents };
