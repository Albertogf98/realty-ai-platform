'use client';

import { ReactNode, useEffect, useState } from 'react';
import AgentLayout from './AgentLayout';
import { useUser } from '../../hooks/useUser';
import Loading from '../components/Loading';
import { useRouter } from 'next/navigation';
import { User } from '@/app/interfaces/user.interface';
import UserLayout from './BuyerLayout';
import { Routes } from '@/app/routes/routes.enum';

interface AuthLayoutProps {
  children: ReactNode;
  role?: 'AGENT' | 'USER';
}

export default function AuthLayout({ children, role }: AuthLayoutProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace(Routes.LOGIN);
      else if (role && user.role !== role) router.replace('/');
      else setAuthorized(true);
    }
  }, [user, isLoading, router, role]);

  if (isLoading || !authorized) return <Loading />;

  const currentUser = user as User;

  return currentUser.role === 'AGENT' ? <AgentLayout>{children}</AgentLayout> : <UserLayout>{children}</UserLayout>;
}
