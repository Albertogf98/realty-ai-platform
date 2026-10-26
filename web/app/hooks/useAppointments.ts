'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/client';
import { useUser } from './useUser';
import { AppointmentWithRelations } from '../interfaces/appointment.interface';

function openGoogleCalendar(title: string, date: string, description: string, location: string) {
  const start = new Date(date).toISOString().replace(/-|:|\.\d+/g, '');
  const end = new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');

  const url = `${process.env.NEXT_PUBLIC_API_GOOGLE}?text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(
    description
  )}&location=${encodeURIComponent(location)}`;

  window.open(url, '_blank');
}

function useAppointments() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const userAppointmentsQuery = useQuery<AppointmentWithRelations[]>({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const res = await api.get<AppointmentWithRelations[]>(`appointments/user/${user.id}`);
      return res.data;
    },
    enabled: !!user,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: { propertyId: string; agentId: string; date: string }) => {
      if (!user) throw new Error('Not authenticated');

      const res = await api.post<AppointmentWithRelations>('appointments', {
        userId: user.id,
        ...data,
      });

      openGoogleCalendar('Title', data.date, 'description', 'location');

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
    },
  });

  return {
    appointments: userAppointmentsQuery.data ?? [],
    isLoading: userAppointmentsQuery.isLoading,
    error: userAppointmentsQuery.error,
    createAppointment: createAppointmentMutation.mutateAsync,
  };
}

function useDeleteAppointment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      await api.delete(`appointments/${appointmentId}`);
      return appointmentId;
    },
    onSuccess: appointmentId => {
      queryClient.invalidateQueries({ queryKey: ['appointments', appointmentId] });
    },
  });

  return {
    deleteAppointment: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

export { useAppointments, useDeleteAppointment };
