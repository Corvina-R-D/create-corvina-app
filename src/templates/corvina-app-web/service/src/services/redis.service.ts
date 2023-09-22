import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';
import { Logger } from '../utils/logger';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_POOL_MIN, REDIS_POOL_MAX } = process.env;

export interface IRedisService {
  getClient(): Promise<RedisClientType>;
}

@Injectable()
export class RedisService implements IRedisService, OnApplicationBootstrap, OnApplicationShutdown {
  private readonly _logger: Logger;

  private _client: RedisClientType;

  constructor(logger: Logger) {
    this._logger = logger;
  }

  async onApplicationBootstrap() {
    if (this._client) {
      return;
    }

    const password = REDIS_PASSWORD ? `:${REDIS_PASSWORD}` : '';
    const db = REDIS_DB || 0;

    this._client = createClient({
      url: `redis://${password}@${REDIS_HOST}:${REDIS_PORT}/${db}`,
      isolationPoolOptions: {
        min: REDIS_POOL_MIN ? Number(REDIS_POOL_MIN) : 1,
        max: REDIS_POOL_MAX ? Number(REDIS_POOL_MAX) : 20,
      },
    });

    await this._client.connect();

    this._logger.info('Redis connected');
  }

  async onApplicationShutdown() {
    await this._client.disconnect();

    this._logger.info('Redis disconnected');
  }

  public async getClient(): Promise<RedisClientType> {
    if (!this._client) {
      await this.onApplicationBootstrap();
    }
    return this._client;
  }
}
