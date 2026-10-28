import { Injectable } from '@nestjs/common';
import * as memjs from 'memjs';

@Injectable()
export class CacheService {
  private client: memjs.Client;

  constructor() {
    const host = process.env.MEMCACHED_HOST || '127.0.0.1';
    const port = process.env.MEMCACHED_PORT || '11211';
    this.client = memjs.Client.create(`${host}:${port}`);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.client.get(key);
      if (!result?.value) return null;

      return JSON.parse(result.value.toString()) as T;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 60) {
    try {
      await this.client.set(key, JSON.stringify(value), {
        expires: ttlSeconds,
      });
    } catch (error) {
      return;
    }
  }

  async del(key: string) {
    try {
      await this.client.delete(key);
    } catch (error) {
      return;
    }
  }
}
