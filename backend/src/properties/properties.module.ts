import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertiesRepository } from './properties.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CacheService } from 'src/cache/cache.service';
import { TypesenseModule } from 'src/typesense/typesense.module';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [TypesenseModule, QueueModule],
  controllers: [PropertiesController],
  providers: [
    PropertiesService,
    PropertiesRepository,
    PrismaService,
    CloudinaryService,
    CacheService,
  ],
  exports: [PropertiesService],
})
export class PropertiesModule {}
