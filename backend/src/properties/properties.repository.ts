import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/cache/cache.service';
import { Prisma } from '@prisma/client';
import { TypesenseService } from 'src/typesense/typesense.service';
import { QueueService } from 'src/queue/queue.service';

type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: { agent: true; buyer: true; images: true };
}>;

@Injectable()
export class PropertiesRepository {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private typesense: TypesenseService,
    private queue: QueueService,
  ) {}

  async findAll(
    query?: string,
    filters?: string,
  ): Promise<PropertyWithRelations[]> {
    const cacheKey = query
      ? `properties:search:${query}:${filters || 'all'}`
      : 'properties:all:full';

    const cached = await this.cache.get<PropertyWithRelations[]>(cacheKey);
    if (cached) return cached;

    let propertyIds: string[] = [];

    if (query || filters) {
      const searchResults = await this.typesense
        .getClient()
        .collections(this.typesense.getCollectionName())
        .documents()
        .search({
          q: query || '*',
          query_by:
            'title_es,title_en,description_es,description_en,address,city,state,country',
          filter_by: filters,
          per_page: 100,
        });

      propertyIds = (searchResults.hits || []).map(
        (hit) => (hit.document as { id: string }).id,
      );

      if (propertyIds.length === 0) {
        await this.cache.set(cacheKey, [], 60);
        return [];
      }
    }

    const properties = await this.prisma.property.findMany({
      where: propertyIds.length ? { id: { in: propertyIds } } : undefined,
      include: { agent: true, buyer: true, images: true },
    });

    await this.cache.set(cacheKey, properties, 60);

    return properties;
  }

  async findOne(id: string): Promise<PropertyWithRelations | null> {
    const cacheKey = `property:${id}`;
    const cached = await this.cache.get<PropertyWithRelations>(cacheKey);
    if (cached) return cached;

    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { agent: true, buyer: true, images: true },
    });

    if (property) await this.cache.set(cacheKey, property, 300);
    return property;
  }

  async create(data: any) {
    const property = await this.prisma.property.create({
      data: {
        title_es: data.title_es,
        title_en: data.title_en,
        description_es: data.description_es,
        description_en: data.description_en,
        price: data.price,
        type: data.type,
        status: data.status,
        operation: data.operation,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        sqm: data.sqm,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        parking: data.parking,
        garden: data.garden,
        agent: data.agent,
        images: data.images,
      },
      include: { images: true },
    });

    await this.queue.addPropertyJob(property);

    return property;
  }

  async update(id: string, data: any) {
    const property = await this.prisma.property.update({ where: { id }, data });

    await this.cache.del(`property:${id}`);
    await this.cache.del('properties:all:full');
    await this.cache.del('properties:all:light');

    try {
      await this.typesense
        .getClient()
        .collections(this.typesense.getCollectionName())
        .documents(id)
        .update({
          ...data,
          id,
        });
    } catch (error) {
      console.error('Error updating property in Typesense', error);
    }

    console.log(property);
    return property;
  }

  async delete(id: string) {
    const property = await this.prisma.property.delete({ where: { id } });

    await this.cache.del(`property:${id}`);
    await this.cache.del('properties:all:full');
    await this.cache.del('properties:all:light');

    try {
      await this.typesense
        .getClient()
        .collections(this.typesense.getCollectionName())
        .documents(id)
        .delete();
    } catch (error) {
      console.error('Error deleting property in Typesense', error);
    }

    return property;
  }

  deleteManyMessages(propertyId: string) {
    return this.prisma.message.deleteMany({ where: { propertyId } });
  }

  deleteManyFavorites(propertyId: string) {
    return this.prisma.favorite.deleteMany({ where: { propertyId } });
  }

  deleteManyImages(propertyId: string) {
    return this.prisma.propertyImage.deleteMany({ where: { propertyId } });
  }

  deleteManyAppointments(propertyId: string) {
    return this.prisma.appointment.deleteMany({ where: { propertyId } });
  }

  count(where?: any) {
    return this.prisma.property.count({ where });
  }

  findMany(params: any) {
    return this.prisma.property.findMany(params);
  }

  findDistinctCities(): Promise<Array<{ city: string }>> {
    return this.prisma.property.findMany({
      select: { city: true },
      distinct: ['city'],
    });
  }
}
