'use client';

import { useState } from 'react';
import { Property } from '@/app/interfaces/property.interface';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const t = useTranslations('PropertyCard');
  const locale = useLocale();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getOperation = () => {
    const rent = t('rent');
    const buy = t('buy');
    return property.operation === 'RENT' ? rent : buy;
  };

  const hasImages = property.images.length > 0;

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === property.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="property-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <div className="relative h-64">
        <span
          className="
            absolute top-3 left-3 
            bg-yellow-500 text-black font-semibold 
            px-3 py-1 rounded-lg text-sm shadow-md z-10
          "
        >
          {getOperation()}
        </span>

        <img
          src={hasImages ? property.images[currentImageIndex].url : '/default-property.png'}
          alt={locale === 'en' ? property.title_en : property.title_es}
          className="w-full h-full object-cover"
        />

        {hasImages && property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 transition"
            >
              &#10094;
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 transition"
            >
              &#10095;
            </button>
          </>
        )}

        {hasImages && property.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={e => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`w-8 h-8 border-2 rounded overflow-hidden ${idx === currentImageIndex ? 'border-yellow-500' : 'border-white'}`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Link data-testid="property-link" href={`/property/${property.id}`} className="block p-4 hover:bg-gray-50 transition rounded-b-xl">
        <h2 data-testid="property-name" className="font-bold text-xl mb-1 text-gray-900 leading-snug hover:text-yellow-600 transition">
          {locale === 'en' ? property.title_en : property.title_es}
        </h2>

        <p className="text-gray-700 mb-2 text-sm">
          {property.city}, {property.state}
        </p>

        <p className="text-yellow-600 font-semibold text-lg mb-2">{property.price.toLocaleString()} €</p>

        <p className="text-gray-600 text-sm">
          {property.rooms} {t('rooms')} · {property.bathrooms} {t('bathrooms')} · {property.sqm} m²
        </p>
      </Link>
    </div>
  );
}
