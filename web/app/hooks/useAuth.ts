'use client';

import { useState } from 'react';
import { Register, useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { api } from '../lib/client';
import { User } from '../interfaces/user.interface';
import { LoginData, LoginResponse, RegisterBody, RegisterResponse } from '../interfaces/auth.interface';
import { AxiosError } from 'axios';

function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('auth/login', data);
      const { user, access_token, refresh_token } = response.data;

      setUser(user);
      Cookies.set('access_token', access_token);
      Cookies.set('refresh_token', refresh_token);
      Cookies.set('userId', user.id);

      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);

    Cookies.remove('access_token');
    Cookies.remove('refresh_token');

    queryClient.removeQueries({ queryKey: ['user'] });
  };

  return { user, login, logout, error, isLoading };
}

function useRegister() {
  return useMutation<
    Register,
    AxiosError<{
      message: string;
      error: string;
      statusCode: number;
    }>,
    RegisterBody
  >({
    mutationFn: async (body: RegisterBody) => {
      const res = await api.post<RegisterResponse>('/auth/register', body);
      return res.data;
    },
  });
}

export { useAuth, useRegister };
