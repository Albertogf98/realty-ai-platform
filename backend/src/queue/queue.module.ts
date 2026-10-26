import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { QueueService } from './queue.service';
import { WorkerService } from './worker.service';
import { TypesenseService } from '../typesense/typesense.service';
import { CacheService } from '../cache/cache.service';

@Module({
  providers: [
    RedisService,
    QueueService,
    WorkerService,
    TypesenseService,
    CacheService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
