'use client';

import { useEffect, useState } from 'react';
import { usePropertyById, useScheduleVisit, useUpdateProperty, useCheckVisit } from '@/app/hooks/useProperties';
import Loading from '../../components/Loading';
import LoadingError from '../../components/LoadingError';
import { useLocale, useTranslations } from 'next-intl';
import { Bed, Bath, Car, Ruler, Leaf, Mail, Phone } from 'lucide-react';
import { PropertyImageSlider } from '../../components/PropertyImageSlider';
import { useUser } from '@/app/hooks/useUser';
import DeletePropertyModal from '../../components/DeletePropertyModal';
import { FavoriteButton } from '../../components/FavoriteButton';
import GhuestLayout from '../../layouts/GuestLayout';
import { api } from '@/app/lib/client';
import { toast } from 'sonner';
import { PropertyImage } from '@/app/interfaces/property.interface';

interface PropertyPageProps {
  params: Promise<{ slug: string }>;
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const t = useTranslations('PropertyDetails');
  const locale = useLocale();
  const { user } = useUser();
  const isAgent = user?.role === 'AGENT';

  const [slug, setSlug] = useState<string | null>(null);
  const [editableProperty, setEditableProperty] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [localScheduled, setLocalScheduled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  useEffect(() => {
    params.then(param => setSlug(param.slug));
  }, [params]);

  const { mutate: scheduleVisit, isPending: isScheduling } = useScheduleVisit();
  const { mutateAsync: updateProperty, isPending: isUpdating } = useUpdateProperty();
  const { data: property, isLoading, error } = usePropertyById(slug || '');
  const { hasScheduledVisit = false } = useCheckVisit(user?.id, property?.id, user?.role);

  useEffect(() => {
    if (property) setEditableProperty(property);
  }, [property]);

  if (isLoading || !editableProperty || !slug) return <Loading />;
  if (error || !property) return <LoadingError />;

  const handleFieldChange = (field: string, value: any) => {
    setEditableProperty((prev: any) => ({ ...prev, [field]: value }));
  };

  const uploadNewImages = async (images: PropertyImage[]) => {
    const newImages = images.filter(img => img.file);
    if (!newImages.length) return [];

    const formData = new FormData();
    newImages.forEach(img => formData.append('images', img.file!));

    const res = await api.post('properties/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.map((img: any) => ({
      url: img.url,
      public_id: img.public_id,
    }));
  };

  const handleSave = async () => {
    if (!editableProperty) return;

    setIsSaving(true);

    try {
      const uploadedImages = await uploadNewImages(editableProperty.images);

      const existingImages = editableProperty.images
        .filter((img: any) => !img.file && img.url !== '/default-property.png')
        .map((img: any) => ({
          id: img.id,
          url: img.url,
          public_id: img.public_id,
        }));

      const payload = {
        ...editableProperty,
        images: [...existingImages, ...uploadedImages],
      };

      await updateProperty({ id: property.id, ...payload });
      toast.success('Property updated');
    } catch (err) {
      console.error(err);
      toast.error('Error updating property');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleVisit = () => {
    if (!user) {
      setLoginMessage(t('loginToSchedule'));
      return;
    }

    if (!user || !property || hasScheduledVisit || localScheduled) return;

    setLocalScheduled(true);
    scheduleVisit({
      senderId: user.id,
      propertyId: property.id,
      content: `${t('visitMessage')}: ${locale === 'en' ? property.title_en : property.title_es}`,
    });
  };

  const getValue = (fieldEn: string, fieldEs: string) => (locale === 'en' ? editableProperty[fieldEn] : editableProperty[fieldEs]);

  return (
    <GhuestLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          {isAgent ? (
            <input
              name="edit-title"
              data-testid="property-title-input"
              className="text-5xl font-bold w-full border-b border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 p-2 rounded-md"
              value={getValue('title_en', 'title_es')}
              onChange={e => handleFieldChange(locale === 'en' ? 'title_en' : 'title_es', e.target.value)}
            />
          ) : (
            <div className="flex items-center space-x-4">
              <h1 className="text-5xl font-bold text-gray-900">{getValue('title_en', 'title_es')}</h1>
              <FavoriteButton propertyId={property.id} />
            </div>
          )}

          {isAgent ? (
            <input
              name="edit-address"
              className="text-xl text-gray-700 w-full border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 p-1 rounded-md mt-2"
              value={editableProperty.address}
              onChange={e => handleFieldChange('address', e.target.value)}
            />
          ) : (
            <p className="text-xl text-gray-700 mt-2">
              {editableProperty.address}, {editableProperty.city}, {editableProperty.state}
            </p>
          )}
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl mb-12">
          <PropertyImageSlider
            images={editableProperty.images}
            alt={getValue('title_en', 'title_es')}
            editable={isAgent}
            onChange={updatedImages => setEditableProperty((prev: any) => ({ ...prev, images: updatedImages }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
              {['price', 'rooms', 'bathrooms', 'sqm'].map(field => (
                <div key={field} className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg">
                  {field === 'price' && <span className="text-green-500 font-bold text-lg mb-2">💰</span>}
                  {field === 'rooms' && <Bed className="h-10 w-10 text-yellow-500 mb-2" />}
                  {field === 'bathrooms' && <Bath className="h-10 w-10 text-yellow-500 mb-2" />}
                  {field === 'sqm' && <Ruler className="h-10 w-10 text-yellow-500 mb-2" />}

                  {isAgent ? (
                    <input
                      name={`edit-${field}`}
                      type="number"
                      className="text-2xl font-bold w-24 text-center border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      value={editableProperty[field] || ''}
                      onChange={e => handleFieldChange(field, e.target.value !== '' ? Number(e.target.value) : '')}
                    />
                  ) : (
                    <span className="text-2xl font-bold">
                      {field === 'price' ? `${editableProperty[field]} €` : editableProperty[field]} {field === 'sqm' ? 'm²' : ''}
                    </span>
                  )}
                </div>
              ))}

              <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg">
                <Car className="h-10 w-10 text-green-500 mb-2" />
                {isAgent ? (
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      name="edit-parking"
                      type="checkbox"
                      checked={editableProperty.parking || false}
                      onChange={e => handleFieldChange('parking', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-yellow-500"
                    />
                    Parking
                  </label>
                ) : (
                  <span className="text-xl font-semibold">{editableProperty.parking ? 'Parking' : 'No parking'}</span>
                )}
              </div>

              <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg">
                <Leaf className="h-10 w-10 text-green-500 mb-2" />
                {isAgent ? (
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      name="edit-garden"
                      type="checkbox"
                      checked={editableProperty.garden || false}
                      onChange={e => handleFieldChange('garden', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-yellow-500"
                    />
                    {t('garden')}
                  </label>
                ) : (
                  <span className="text-xl font-semibold">{editableProperty.garden ? 'Garden' : 'No garden'}</span>
                )}
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4">Description</h2>
            {isAgent ? (
              <textarea
                name="edit-description"
                className="w-full border rounded-2xl p-6 text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-lg"
                value={getValue('description_en', 'description_es')}
                onChange={e => handleFieldChange(locale === 'en' ? 'description_en' : 'description_es', e.target.value)}
              />
            ) : (
              <p className="text-gray-700 leading-relaxed text-lg">{getValue('description_en', 'description_es')}</p>
            )}

            {isAgent && (
              <button
                data-testid="save-button"
                onClick={handleSave}
                disabled={isSaving || isUpdating}
                className={`mt-6 px-8 py-3 rounded-2xl font-bold text-lg shadow-lg transition ${
                  isSaving || isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isSaving || isUpdating ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </div>

          <aside className="md:sticky md:top-28 md:h-fit mt-8 md:mt-0">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              {isAgent && (
                <div className="mb-4 p-2 bg-gray-100 rounded-md text-gray-700 font-mono text-sm select-all">
                  <p data-testid="property-id">{property.id}</p>
                </div>
              )}

              <h2 className="text-2xl font-bold mb-4">Agent</h2>
              <p className="text-gray-900 font-semibold text-lg">{editableProperty.agent.name}</p>
              <div className="mt-3 flex flex-col gap-2 text-gray-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" /> <span>{editableProperty.agent.email}</span>
                </div>
                {editableProperty.agent.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" /> <span>{editableProperty.agent.phone}</span>
                  </div>
                )}
              </div>

              {!isAgent && (
                <button
                  data-testid="schedule-visit-button"
                  onClick={handleScheduleVisit}
                  disabled={hasScheduledVisit || localScheduled || isScheduling}
                  className={`w-full mt-6 py-3 rounded-xl text-white font-semibold text-lg ${
                    hasScheduledVisit || localScheduled || isScheduling ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 shadow-md'
                  }`}
                >
                  {hasScheduledVisit || localScheduled ? t('messageSent') : t('scheduleVisit')}
                </button>
              )}
              {loginMessage && (
                <p data-testid="login-message" className="text-red-500 mt-2 text-sm">
                  {loginMessage}
                </p>
              )}

              {isAgent && (
                <>
                  <button
                    data-testid="delete-property-button"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full mt-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-md text-lg font-semibold"
                  >
                    Delete Property
                  </button>
                  <DeletePropertyModal propertyId={property.id} isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </GhuestLayout>
  );
}
