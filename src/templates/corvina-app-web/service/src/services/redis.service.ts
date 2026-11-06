import { Logger } from '@corvina/nestjs-app-common-lib';
import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { RedisClientType, createClient } from '@redis/client';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } = process.env;

export interface IRedisService {
  getClient(): Promise<RedisClientType>;
}

/**
 * The only place that creates the Redis client, so that swapping client (e.g. for Valkey) changes only this file.
 */
@Injectable()
export class RedisService implements IRedisService, OnApplicationBootstrap, OnApplicationShutdown {
  private readonly _logger: Logger;

  private _client: RedisClientType;

  private _connecting: Promise<RedisClientType>;

  constructor(logger: Logger) {
    this._logger = logger;
  }

  async onApplicationBootstrap() {
    await this.getClient();
  }

  async onApplicationShutdown() {
    if (!this._client) {
      return;
    }

    await this._client.close();

    this._logger.info('Redis disconnected');
  }

  public async getClient(): Promise<RedisClientType> {
    if (!this._connecting) {
      this._connecting = this.connect().catch((error) => {
        // allow a later call to retry
        this._connecting = undefined;
        throw error;
      });
    }
    return this._connecting;
  }

  private async connect(): Promise<RedisClientType> {
    const password = REDIS_PASSWORD ? `:${REDIS_PASSWORD}` : '';
    const db = REDIS_DB || 0;

    const client: RedisClientType = createClient({
      url: `redis://${password}@${REDIS_HOST}:${REDIS_PORT}/${db}`,
      // Redis Enterprise maintenance notifications (on by default with RESP3 since v6), not implemented by Redis OSS and Valkey
      maintNotifications: 'disabled',
    });

    // without an error listener node-redis rethrows connection errors, crashing the process
    client.on('error', (error) => this._logger.error({ msg: 'Redis client error', error }));

    await client.connect();
    this._client = client;

    this._logger.info('Redis connected');

    return client;
  }
}
