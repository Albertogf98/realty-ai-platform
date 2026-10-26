import PropertyCard from './PropertyCard';

interface PropertyListProps {
  properties: any[]; // ahora es solo un array
}

export default function PropertyList({ properties }: PropertyListProps) {
  if (!properties || properties.length === 0) {
    return <p className="text-center text-gray-500">No properties found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {properties.map((prop: any) => (
        <PropertyCard key={prop.id} property={prop} />
      ))}
    </div>
  );
}
