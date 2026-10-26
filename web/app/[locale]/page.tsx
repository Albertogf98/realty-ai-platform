'use client';

import { useState } from 'react';
import PropertyFiltersComponent from './components/PropertyFilters';
import PropertyList from './components/PropertyList';
import Loading from './components/Loading';
import LoadingError from './components/LoadingError';
import { PropertyFilters } from '../interfaces/property.interface';
import { usePropertiesPaginate } from '../hooks/useProperties';
import GhuestLayout from './layouts/GuestLayout';
import Pagination from './components/Pagination';

export default function Page() {
  const [filters, setFilters] = useState<PropertyFilters>({
    page: 1,
    pageSize: 6,
  });

  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);

  const { data, isLoading, isError } = usePropertiesPaginate(filters);

  const handleChangeFilters = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setLocalFilters(prev => ({
      ...prev,
      [name]: value === '' ? undefined : isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({
      ...prev,
      ...localFilters,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    const reset = { page: 1, pageSize: 6 };

    setLocalFilters(reset);
    setFilters(reset);
  };

  const totalPages = Math.ceil((data?.pagination.totalItems || 0) / (filters.pageSize || 6));
  const currentPage = data?.pagination.page || 1;

  if (isLoading) return <Loading />;
  if (isError) return <LoadingError />;

  return (
    <GhuestLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="property-list">
        <PropertyFiltersComponent filters={localFilters} onChange={handleChangeFilters} onApply={handleApplyFilters} onReset={handleResetFilters} />

        <PropertyList properties={data?.data || []} />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={page => setFilters(prev => ({ ...prev, page }))} />
      </div>
    </GhuestLayout>
  );
}
