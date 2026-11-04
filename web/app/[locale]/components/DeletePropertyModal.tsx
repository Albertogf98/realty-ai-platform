'use client';

import { useEffect, useRef, useState } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations('PropertyDetails');

  const { mutate, isPending, error } = useRemoveProperty();

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

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
      <div role="dialog" aria-modal="true" aria-labelledby="delete-property-title" className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 id="delete-property-title" className="text-xl font-semibold mb-4">
          {t('confirmDelete')}
        </h2>

        <label htmlFor="delete-property-id" className="mb-2 block">
          {t('typePropertyIdToConfirm')}
        </label>

        <input
          ref={inputRef}
          id="delete-property-id"
          name="propertyId"
          data-testid="property-id-input"
          type="text"
          value={confirmId}
          onChange={e => setConfirmId(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        {(localError || error) && (
          <p data-testid="error-message" role="alert" className="text-red-600 mb-2">
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
