import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ICacheService } from './cache.service';

const CLEANUP_EXPIRED_INTERVAL = 10000;

@Injectable()
export class InMemoryCacheService implements ICacheService, OnApplicationBootstrap, OnApplicationShutdown {
  private _cache: Map<string, { value: any; expiresAt: number }> = new Map();

  private _interval: NodeJS.Timeout;

  onApplicationBootstrap() {
    this._interval = setInterval(() => {
      this._cache.forEach((value, key) => {
        if (value.expiresAt < Date.now()) {
          this._cache.delete(key);
        }
      });
    }, CLEANUP_EXPIRED_INTERVAL);
  }

  onApplicationShutdown() {
    clearInterval(this._interval);
  }

  async get<T>(key: string): Promise<T> {
    const cacheEntry = this._cache.get(key);
    if (!cacheEntry) {
      return null;
    }

    if (cacheEntry.expiresAt < Date.now()) {
      this._cache.delete(key);
      return null;
    }

    return cacheEntry.value;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    this._cache.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  }

  async del(key: string): Promise<void> {
    this._cache.delete(key);
  }
}
