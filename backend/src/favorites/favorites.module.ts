import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './favorites.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheService } from 'src/cache/cache.service';

@Module({
  imports: [PrismaModule],
  controllers: [FavoritesController],
  providers: [FavoritesService, FavoritesRepository, CacheService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
