import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(private readonly repo: FavoritesRepository) {}

  async add(userId: string, propertyId: string) {
    if (!userId || !propertyId)
      throw new BadRequestException('userId and propertyId are required');

    const exists = await this.repo.exists(userId, propertyId);
    if (exists) throw new ConflictException('Property already in favorites');

    return this.repo.create(userId, propertyId);
  }

  async remove(userId: string, propertyId: string) {
    if (!userId || !propertyId)
      throw new BadRequestException('userId and propertyId are required');

    return this.repo.delete(userId, propertyId);
  }

  async getFavoritesByUser(userId: string) {
    return this.repo.findByUser(userId);
  }
}
