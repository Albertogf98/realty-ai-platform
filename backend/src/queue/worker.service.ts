import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { RedisService } from './redis.service';
import { TypesenseService } from '../typesense/typesense.service';
import { CacheService } from '../cache/cache.service';

interface PropertyIndexJobData {
  id: string;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  price: number;
  type: string;
  status: string;
  operation: string;
  rooms: number;
  bathrooms: number;
  sqm: number;
  address: string;
  city: string;
  state: string;
  country: string;
  agentId: string;
}

@Injectable()
export class WorkerService implements OnModuleInit {
  constructor(
    private redis: RedisService,
    private typesense: TypesenseService,
    private cache: CacheService,
  ) {}

  onModuleInit() {
    new Worker<PropertyIndexJobData>(
      'property',
      async (job) => {
        const property = job.data;

        await this.typesense
          .getClient()
          .collections(this.typesense.getCollectionName())
          .documents()
          .create({
            id: property.id,
            title_es: property.title_es,
            title_en: property.title_en,
            description_es: property.description_es,
            description_en: property.description_en,
            price: property.price,
            type: property.type,
            status: property.status,
            operation: property.operation,
            rooms: property.rooms,
            bathrooms: property.bathrooms,
            sqm: property.sqm,
            address: property.address,
            city: property.city,
            state: property.state,
            country: property.country,
            agentId: property.agentId,
          });

        await this.cache.del('properties:all:full');
        await this.cache.del('properties:all:light');
      },
      {
        connection: this.redis.client,
      },
    );
  }
}
