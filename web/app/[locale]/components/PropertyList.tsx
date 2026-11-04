import PropertyCard from './PropertyCard';
import { useLocale } from 'next-intl';
import type { Property } from '@/app/interfaces/property.interface';

interface PropertyListProps {
  properties: Property[];
}

export default function PropertyList({ properties }: PropertyListProps) {
  const locale = useLocale();
  if (!properties || properties.length === 0) {
    return (
      <p role="status" className="text-center text-gray-600">
        {locale === 'es' ? 'No se encontraron propiedades.' : 'No properties found.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {properties.map(prop => (
        <PropertyCard key={prop.id} property={prop} />
      ))}
    </div>
  );
}
