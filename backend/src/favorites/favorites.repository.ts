import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavoritesRepository {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async create(userId: string, propertyId: string) {
    const favorite = await this.prisma.favorite.create({
      data: { userId, propertyId },
    });

    await this.cache.del(`user:${userId}:favorites:v2`);
    return favorite;
  }

  async delete(userId: string, propertyId: string) {
    const result = await this.prisma.favorite.deleteMany({
      where: { userId, propertyId },
    });

    await this.cache.del(`user:${userId}:favorites:v2`);
    return result;
  }

  async findByUser(userId: string) {
    const cacheKey = `user:${userId}:favorites:v2`;
    const cached = await this.cache.get(cacheKey);

    if (cached) return cached;

    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title_es: true,
            title_en: true,
            description_es: true,
            description_en: true,
            price: true,
            type: true,
            status: true,
            operation: true,
            rooms: true,
            bathrooms: true,
            sqm: true,
            address: true,
            city: true,
            state: true,
            country: true,
            zipCode: true,
            latitude: true,
            longitude: true,
            parking: true,
            garden: true,
            isActive: true,
            createdAt: true,
            soldAt: true,
            agentId: true,
            agent: { select: { id: true, name: true, role: true } },
            images: true,
          },
        },
      },
    });

    await this.cache.set(cacheKey, favorites, 300);
    return favorites;
  }

  exists(userId: string, propertyId: string) {
    return this.prisma.favorite.findFirst({
      where: { userId, propertyId },
    });
  }
}
