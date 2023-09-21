import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { IRedisService } from './redis.service';
import { Logger } from '../utils/logger';

export interface IRateLimiterService {
  incr(identifier: string, options: IRateLimiterServiceOptions): Promise<{ count: number; canDo: boolean }>;
}

export function getRateLimiterKey(identifier: string) {
  const now = new Date();

  const key = `rl:${identifier}:${now.getSeconds()}`;
  return key;
}

export interface IRateLimiterServiceOptions {
  max: number;
}

/**
 * Rate limiter service based on Redis.
 * Based on https://redis.com/glossary/rate-limiting/
 */
@Injectable()
export class RateLimiterService implements IRateLimiterService {
  private _logger: Logger;

  private _redisService: IRedisService;

  private _redisClient: RedisClientType;

  constructor(@Inject('IRedisService') redisService: IRedisService, logger: Logger) {
    this._redisService = redisService;
    this._logger = logger;
  }

  async incr(identifier: string, options: IRateLimiterServiceOptions): Promise<{ count: number; canDo: boolean }> {
    const { max } = options;

    if (!identifier) {
      throw new Error('RateLimiterService.incr: identifier is required');
    }

    if (!max) {
      throw new Error('RateLimiterService.incr: max is required');
    }

    await this.initClient();

    const multi = await this._redisClient.multi();

    const key = getRateLimiterKey(identifier);

    await multi.incr(key);

    await multi.pExpire(key, 999);

    const [value] = await multi.exec(true);

    const count = Number(value);

    this._logger.debug(`RateLimiterService.incr: key=${key} count=${count}`);

    return { count, canDo: RateLimiterService.canDo(count, max) };
  }

  private static canDo(count: number, max): boolean {
    return count <= max;
  }

  private async initClient() {
    if (!this._redisClient) {
      this._redisClient = await this._redisService.getClient();
    }
  }
}
