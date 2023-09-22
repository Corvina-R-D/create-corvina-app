import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { IRedisService } from './redis.service';

export interface ICacheService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

const { CACHE_DEFAULT_TTL } = process.env;

@Injectable()
export class CacheService implements ICacheService, OnApplicationBootstrap {
  private _redisService: IRedisService;

  private _client: RedisClientType;

  constructor(@Inject('IRedisService') redisService: IRedisService) {
    this._redisService = redisService;
  }

  async onApplicationBootstrap() {
    this._client = await this._redisService.getClient();
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const value = await this._client.get(key);

    return value ? JSON.parse(value) : undefined;
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const internalTtl = ttl || Number(CACHE_DEFAULT_TTL);
    const isMillis = internalTtl < 1;
    const options = {
      [isMillis ? 'PX' : 'EX']: isMillis ? internalTtl * 1000 : internalTtl,
    };

    await this._client.set(key, JSON.stringify(value), options);
  }

  public async del(key: string): Promise<void> {
    await this._client.del(key);
  }
}
