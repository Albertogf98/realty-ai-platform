import {
  PrismaClient,
  PropertyType,
  PropertyStatus,
  OperationType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agent = await prisma.user.findFirst({
    where: { role: 'AGENT' },
  });

  if (!agent) {
    throw new Error('No AGENT user found to attach properties');
  }

  await prisma.propertyImage.deleteMany({});
  await prisma.property.deleteMany({});

  const properties = [
    {
      title_es: 'Piso en Barcelona',
      title_en: 'Apartment in Barcelona',
      description_es:
        'Piso moderno en Barcelona con dos habitaciones y cocina abierta.',
      description_en:
        'Modern apartment in Barcelona with two bedrooms and open kitchen.',
      price: 1200,
      type: PropertyType.APARTMENT,
      status: PropertyStatus.USED,
      operation: OperationType.RENT,
      rooms: 2,
      bathrooms: 1,
      sqm: 68,
      address: 'Calle de la Mercè 12',
      city: 'Barcelona',
      state: 'Catalonia',
      country: 'Spain',
      zipCode: '08001',
      parking: false,
      garden: false,
      isActive: true,
      agentId: agent.id,
    },
    {
      title_es: 'Casa en Valencia',
      title_en: 'House in Valencia',
      description_es:
        'Casa familiar con tres habitaciones, dos baños y jardín pequeño.',
      description_en:
        'Family house with three bedrooms, two bathrooms and a small garden.',
      price: 300000,
      type: PropertyType.HOUSE,
      status: PropertyStatus.USED,
      operation: OperationType.SALE,
      rooms: 3,
      bathrooms: 2,
      sqm: 120,
      address: 'Avenida del Mar 45',
      city: 'Valencia',
      state: 'Valencia',
      country: 'Spain',
      zipCode: '46001',
      parking: true,
      garden: true,
      isActive: true,
      agentId: agent.id,
    },
    {
      title_es: 'Apartamento en Madrid',
      title_en: 'Apartment in Madrid',
      description_es:
        'Apartamento de compra con buenas vistas y dos dormitorios.',
      description_en: 'Apartment for sale with great views and two bedrooms.',
      price: 200000,
      type: PropertyType.APARTMENT,
      status: PropertyStatus.USED,
      operation: OperationType.SALE,
      rooms: 2,
      bathrooms: 1,
      sqm: 82,
      address: 'Calle Mayor 5',
      city: 'Madrid',
      state: 'Madrid',
      country: 'Spain',
      zipCode: '28001',
      parking: false,
      garden: false,
      isActive: true,
      agentId: agent.id,
    },
    {
      title_es: 'Chalet en Málaga',
      title_en: 'House in Málaga',
      description_es:
        'Chalet nuevo en Málaga con diseño contemporáneo y amplio jardín.',
      description_en:
        'New house in Málaga with contemporary design and large garden.',
      price: 420000,
      type: PropertyType.HOUSE,
      status: PropertyStatus.NEW,
      operation: OperationType.SALE,
      rooms: 4,
      bathrooms: 3,
      sqm: 170,
      address: 'Calle del Sol 88',
      city: 'Málaga',
      state: 'Andalusia',
      country: 'Spain',
      zipCode: '29001',
      parking: true,
      garden: true,
      isActive: true,
      agentId: agent.id,
    },
    {
      title_es: 'Piso a reformar en Sevilla',
      title_en: 'Flat to renovate in Seville',
      description_es: 'Piso en Sevilla listo para reformar con gran potencial.',
      description_en: 'Flat in Seville ready to renovate with high potential.',
      price: 80000,
      type: PropertyType.APARTMENT,
      status: PropertyStatus.TO_RENOVATE,
      operation: OperationType.RENT,
      rooms: 2,
      bathrooms: 1,
      sqm: 76,
      address: 'Plaza Nueva 7',
      city: 'Sevilla',
      state: 'Andalusia',
      country: 'Spain',
      zipCode: '41001',
      parking: false,
      garden: false,
      isActive: true,
      agentId: agent.id,
    },
  ];

  await prisma.property.createMany({
    data: properties,
  });

  console.log(`Inserted ${properties.length} properties for QA.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
