'use client';

import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { useAppointments, useDeleteAppointment } from '@/app/hooks/useAppointments';
import { useUser } from '@/app/hooks/useUser';
import { formatDate } from '@/app/lib/formatDate';
import Loading from '../components/Loading';
import LoadingError from '../components/LoadingError';
import AuthLayout from '../layouts/AuthLayout';

export default function AppointmentsPage() {
  const t = useTranslations('Appointments');
  const locale = useLocale();
  const { user } = useUser();
  const { appointments, isLoading, error } = useAppointments();
  const { deleteAppointment, isDeleting } = useDeleteAppointment();

  const isPast = (date: string) => new Date(date).getTime() < Date.now();

  const handleDelete = async (id: string) => {
    toast.promise(deleteAppointment(id), {
      loading: t('deleting'),
      success: t('deleted'),
      error: t('deleteError'),
    });
  };

  const futureAppointments = appointments.filter(app => app.agent.id === user!.id).filter(app => !isPast(app.date));

  return (
    <AuthLayout role="AGENT">
      <div className="flex flex-col items-center justify-start min-h-screen w-full bg-white py-6 px-4">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <LoadingError />
        ) : (
          <div className="w-full max-w-4xl space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-center">{t('title')}</h1>

            {futureAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-6">{t('noAppointments')}</p>
            ) : (
              <div className="space-y-4">
                {futureAppointments.map(app => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-xl shadow-sm bg-gray-50 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-lg">{app.property.title_en || t('property')}</p>
                      <p className="text-gray-500 text-sm">
                        {t('date')}: {formatDate(app.date, locale)}
                      </p>
                      <p className="text-gray-500 text-sm">{t('client', { email: app.user?.email })}</p>
                    </div>

                    <button
                      onClick={() => handleDelete(app.id)}
                      disabled={isDeleting}
                      className="mt-2 sm:mt-0 ml-0 sm:ml-4 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {t('delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
