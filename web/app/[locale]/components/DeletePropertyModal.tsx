'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRemoveProperty } from '@/app/hooks/useProperties';

interface DeletePropertyModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeletePropertyModal({ propertyId, isOpen, onClose }: DeletePropertyModalProps) {
  const [confirmId, setConfirmId] = useState('');
  const [localError, setLocalError] = useState('');
  const router = useRouter();
  const t = useTranslations('PropertyDetails');

  const { mutate, isPending, error } = useRemoveProperty();

  if (!isOpen) return null;

  const handleDelete = () => {
    if (confirmId !== propertyId) {
      setLocalError(t('idDoesNotMatch'));
      return;
    }

    mutate(propertyId, {
      onSuccess: () => {
        onClose();
        router.push('/');
      },
      onError: () => {
        setLocalError(t('deleteFailed'));
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{t('confirmDelete')}</h2>

        <p className="mb-2">{t('typePropertyIdToConfirm')}</p>

        <input
          name="propertyId"
          data-testid="property-id-input"
          type="text"
          value={confirmId}
          onChange={e => setConfirmId(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        {(localError || error) && (
          <p data-testid="error-message" className="text-red-600 mb-2">
            {localError || t('deleteFailed')}
          </p>
        )}

        <div className="flex justify-end gap-4">
          <button data-testid="cancel-button" onClick={onClose} disabled={isPending} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">
            {t('cancel')}
          </button>

          <button data-testid="delete-button" onClick={handleDelete} disabled={isPending} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
            {isPending ? t('deleting') : t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
