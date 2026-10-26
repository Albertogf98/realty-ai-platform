import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from './redis.service';

@Injectable()
export class QueueService {
  public propertyQueue: Queue;

  constructor(private redis: RedisService) {
    this.propertyQueue = new Queue('property', {
      connection: this.redis.client,
    });
  }

  addPropertyJob(property: any) {
    return this.propertyQueue.add('index-property', property);
  }
}
