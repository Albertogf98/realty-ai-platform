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

    await this.cache.del(`user:${userId}:favorites`);
    return favorite;
  }

  async delete(userId: string, propertyId: string) {
    const result = await this.prisma.favorite.deleteMany({
      where: { userId, propertyId },
    });

    await this.cache.del(`user:${userId}:favorites`);
    return result;
  }

  async findByUser(userId: string) {
    const cacheKey = `user:${userId}:favorites`;
    const cached = await this.cache.get(cacheKey);

    if (cached) return cached;

    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            agent: true,
            images: true,
          },
        },
      },
    });

    await this.cache.set(cacheKey, favorites, 300); // TTL 5 min
    return favorites;
  }

  exists(userId: string, propertyId: string) {
    return this.prisma.favorite.findFirst({
      where: { userId, propertyId },
    });
  }
}
