'use client';

import AuthLayout from '@/app/[locale]/layouts/AuthLayout';
import { useCities } from '@/app/hooks/useCities';
import { useNewProperty } from '@/app/hooks/useProperties';
import { useAgents } from '@/app/hooks/useUser';
import { CreatePropertyDto, OperationType, PropertyStatus, PropertyType } from '@/app/interfaces/property.interface';
import { useTranslations } from 'next-intl';

export default function NewPropertyForm() {
  const { form, setField, previewImages, addImages, removeImage, createProperty, isLoading } = useNewProperty();
  const { data: cities, isPending: isCitiesLoading, error: citiesError } = useCities('Spain', 'Andalusia');
  const { data: agents = [] } = useAgents();
  const t = useTranslations('RegisterProperty');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProperty();
  };

  type TextFieldKey = {
    [K in keyof CreatePropertyDto]: CreatePropertyDto[K] extends string | number ? K : never;
  }[keyof CreatePropertyDto];
  const fields: {
    id: string;
    type: 'text' | 'number' | 'textarea';
    label: string;
    key: TextFieldKey;
  }[] = [
    { id: 'titleEs', type: 'text', label: t('titleEs'), key: 'titleEs' },
    { id: 'titleEn', type: 'text', label: t('titleEn'), key: 'titleEn' },
    { id: 'descriptionEs', type: 'textarea', label: t('descriptionEs'), key: 'descriptionEs' },
    { id: 'descriptionEn', type: 'textarea', label: t('descriptionEn'), key: 'descriptionEn' },
    { id: 'price', type: 'number', label: t('price'), key: 'price' },
    { id: 'rooms', type: 'number', label: t('rooms'), key: 'rooms' },
    { id: 'bathrooms', type: 'number', label: t('bathrooms'), key: 'bathrooms' },
    { id: 'sqm', type: 'number', label: t('sqm'), key: 'sqm' },
    { id: 'address', type: 'text', label: t('address'), key: 'address' },
    { id: 'stateCity', type: 'text', label: t('state'), key: 'stateCity' },
    { id: 'country', type: 'text', label: t('country'), key: 'country' },
    { id: 'zipCode', type: 'text', label: t('zipCode'), key: 'zipCode' },
    { id: 'latitude', type: 'number', label: t('latitude'), key: 'latitude' },
    { id: 'longitude', type: 'number', label: t('longitude'), key: 'longitude' },
  ];

  return (
    <AuthLayout>
      <div className="min-h-screen w-full flex items-start justify-center bg-white p-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-3xl flex flex-col gap-6">
          <h1 className="text-3xl font-bold text-yellow-700 text-center">{t('createProperty')}</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(f => (
              <div key={f.id} className="col-span-1 md:col-span-2">
                <label htmlFor={f.id} className="block font-semibold mb-1 text-gray-900">
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={f.id}
                    value={form[f.key as keyof CreatePropertyDto] as string | number | ''}
                    onChange={e => setField(f.key as keyof CreatePropertyDto, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="border p-3 rounded w-full bg-yellow-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                    required
                  />
                ) : (
                  <input
                    id={f.id}
                    type={f.type}
                    value={form[f.key as keyof CreatePropertyDto] as string | number | ''}
                    onChange={e => setField(f.key as keyof CreatePropertyDto, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="border p-3 rounded w-full bg-yellow-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                    required
                  />
                )}
              </div>
            ))}

            <div>
              <label className="block font-semibold mb-1 text-gray-900">{t('propertyType')}</label>
              <select
                data-testid="property-type"
                value={form.type}
                onChange={e => setField('type', e.target.value as PropertyType)}
                className="border p-3 rounded w-full bg-yellow-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              >
                {Object.values(PropertyType).map(type => (
                  <option key={type} value={type}>
                    {t(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-900">{t('status')}</label>
              <select
                data-testid="status"
                value={form.status}
                onChange={e => setField('status', e.target.value as PropertyStatus)}
                className="border p-3 rounded w-full bg-yellow-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              >
                {Object.values(PropertyStatus).map(status => (
                  <option key={status} value={status}>
                    {t(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-900">{t('operation')}</label>
              <select
                data-testid="operation"
                value={form.operation}
                onChange={e => setField('operation', e.target.value as OperationType)}
                className="border p-3 rounded w-full bg-yellow-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              >
                {Object.values(OperationType).map(op => (
                  <option key={op} value={op}>
                    {t(op)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-900">{t('city')}</label>
              <select
                data-testid="city"
                value={form.city}
                onChange={e => setField('city', e.target.value)}
                className="border p-3 rounded w-full bg-yellow-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              >
                <option value="">{t('selectCity')}</option>
                {isCitiesLoading && <option disabled>{t('loading')}</option>}
                {citiesError && <option disabled>{t('errorLoading')}</option>}
                {cities?.map(c => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-900">{t('agent')}</label>
              <select
                required
                data-testid="agent"
                value={form.agentId}
                onChange={e => setField('agentId', e.target.value)}
                className="border p-3 rounded w-full bg-yellow-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              >
                <option value="">{t('selectAgent')}</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-6 items-center col-span-1 md:col-span-2">
              <label className="flex items-center gap-2 text-gray-900">
                <input data-testid="parking" type="checkbox" checked={form.parking} onChange={e => setField('parking', e.target.checked)} />
                {t('parking')}
              </label>
              <label className="flex items-center gap-2 text-gray-900">
                <input data-testid="garden" type="checkbox" checked={form.garden} onChange={e => setField('garden', e.target.checked)} />
                {t('garden')}
              </label>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold mb-2 text-gray-900">{t('images')}</label>
              <div
                data-testid="image-dropzone"
                className="border-2 border-dashed border-yellow-400 p-6 rounded text-center cursor-pointer hover:bg-yellow-50 transition"
                onDragOver={e => e.preventDefault()}
                onDrop={e => addImages(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')))}
                onClick={() => document.getElementById('images')?.click()}
              >
                {t('dragOrClick')}
              </div>
              <input type="file" id="images" multiple accept="image/*" className="hidden" onChange={e => e.target.files && addImages(Array.from(e.target.files))} />

              {previewImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewImages.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} className="w-24 h-24 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2">
              <button type="submit" disabled={isLoading} className="bg-yellow-700 text-white p-3 rounded w-full font-semibold hover:bg-yellow-600 transition">
                {isLoading ? t('saving') : t('createProperty')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
