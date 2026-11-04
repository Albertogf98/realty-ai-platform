'use client';

import { PropertyFilters } from '@/app/interfaces/property.interface';
import { useTranslations } from 'next-intl';
import React from 'react';

interface FiltersProps {
  filters: PropertyFilters;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function PropertyFiltersComponent({ filters, onChange, onApply, onReset }: FiltersProps) {
  const t = useTranslations('Filters');

  const inputClasses =
    'bg-gray-100 text-gray-900 border border-gray-300 p-3 rounded-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400 transition leading-relaxed';

  return (
    <section aria-labelledby="property-filters-heading" className="bg-white p-6 rounded-xl shadow-md mb-8">
      <h2 id="property-filters-heading" className="text-2xl font-semibold mb-4 text-yellow-700">
        {t('filters')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <label className="sr-only" htmlFor="filter-title">
          {t('title')}
        </label>
        <input
          id="filter-title"
          data-testid="title-input"
          type="text"
          name="title"
          placeholder={t('title')}
          value={filters.title || ''}
          onChange={onChange}
          className={inputClasses}
        />
        <label className="sr-only" htmlFor="filter-city">
          {t('city')}
        </label>
        <input id="filter-city" data-testid="city-input" type="text" name="city" placeholder={t('city')} value={filters.city || ''} onChange={onChange} className={inputClasses} />
        <label className="sr-only" htmlFor="filter-type">
          {t('type')}
        </label>
        <select id="filter-type" data-testid="type-select" name="type" value={filters.type || ''} onChange={onChange} className={inputClasses}>
          <option data-testid="type-option" value="">
            {t('type')}
          </option>
          <option data-testid="type-house-option" value="HOUSE">
            {t('typeHouse')}
          </option>
          <option data-testid="type-apartment-option" value="APARTMENT">
            {t('typeApartment')}
          </option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 mb-4">
        <label className="sr-only" htmlFor="filter-status">
          {t('status')}
        </label>
        <select id="filter-status" data-testid="status-select" name="status" value={filters.status || ''} onChange={onChange} className={inputClasses}>
          <option data-testid="status-option" value="">
            {t('status')}
          </option>
          <option data-testid="status-new-option" value="NEW">
            {t('statusNew')}
          </option>
          <option data-testid="status-used-option" value="USED">
            {t('statusUsed')}
          </option>
          <option data-testid="status-to-renovate-option" value="TO_RENOVATE">
            {t('statusToRenovate')}
          </option>
        </select>

        <label className="sr-only" htmlFor="filter-operation">
          {t('operation')}
        </label>
        <select id="filter-operation" data-testid="operation-select" name="operation" value={filters.operation || ''} onChange={onChange} className={inputClasses}>
          <option data-testid="operation-option" value="">
            {t('operation')}
          </option>
          <option data-testid="operation-sale-option" value="SALE">
            {t('operationSale')}
          </option>
          <option data-testid="operation-rent-option" value="RENT">
            {t('operationRent')}
          </option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <label className="sr-only" htmlFor="filter-rooms">
          {t('rooms')}
        </label>
        <input
          id="filter-rooms"
          data-testid="rooms-input"
          type="number"
          name="rooms"
          placeholder={t('rooms')}
          value={filters.rooms || ''}
          onChange={onChange}
          min={0}
          className={inputClasses}
        />
        <label className="sr-only" htmlFor="filter-bathrooms">
          {t('bathrooms')}
        </label>
        <input
          id="filter-bathrooms"
          data-testid="bathrooms-input"
          type="number"
          name="bathrooms"
          placeholder={t('bathrooms')}
          value={filters.bathrooms || ''}
          onChange={onChange}
          min={0}
          className={inputClasses}
        />
        <label className="sr-only" htmlFor="filter-min-price">
          {t('minPrice')}
        </label>
        <input
          id="filter-min-price"
          data-testid="min-price-input"
          type="number"
          name="minPrice"
          placeholder={`${t('minPrice')} €`}
          value={filters.minPrice || ''}
          onChange={onChange}
          min={0}
          className={inputClasses}
        />
        <label className="sr-only" htmlFor="filter-max-price">
          {t('maxPrice')}
        </label>
        <input
          id="filter-max-price"
          data-testid="max-price-input"
          type="number"
          name="maxPrice"
          placeholder={`${t('maxPrice')} €`}
          value={filters.maxPrice || ''}
          onChange={onChange}
          min={0}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-4">
        <button type="button" data-testid="apply-button" onClick={onApply} className="bg-yellow-600 text-white py-2 px-6 rounded-xl hover:bg-yellow-700 transition">
          {t('apply') || 'Apply'}
        </button>
        <button type="button" data-testid="reset-button" onClick={onReset} className="bg-gray-200 text-gray-700 py-2 px-6 rounded-xl hover:bg-gray-300 transition">
          {t('reset') || 'Reset'}
        </button>
      </div>
    </section>
  );
}
