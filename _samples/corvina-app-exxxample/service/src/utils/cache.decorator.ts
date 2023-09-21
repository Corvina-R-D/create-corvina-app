/* eslint-disable no-param-reassign */
import { Inject } from '@nestjs/common';
import { Logger } from './logger';

export interface ICacheMethodOptions {
  prefix?: string;
  ttl?: number;
  keyBuilder?: (args: any[]) => string;
}

/**
 * This decorator is used to cache the result of a method.
 * The cache key is the method name and the arguments. You can also specify a custom key prefix.
 */
export function CacheMethod({ prefix, ttl, keyBuilder }: ICacheMethodOptions = {}) {
  const injectCacheManager = Inject('ICacheService');
  const injectLogger = Inject(Logger);

  return function injectCache(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectCacheManager(target, '_cacheService');
    injectLogger(target, '_logger');

    if (typeof descriptor?.value === 'function' && descriptor.value[Symbol.toStringTag] === 'AsyncFunction') {
      const original = descriptor.value;

      descriptor.value = async function pushTransactionArgument(...args: any[]) {
        if (!this._cacheService) {
          throw new Error(`CacheManager is not defined`);
        }

        const key = keyBuilder ? keyBuilder(args) : `${prefix || ''}${propertyKey}(${args.map((arg) => JSON.stringify(arg)).join(',')})`;

        const cachedValue = await this._cacheService.get(key);

        if (cachedValue) {
          this._logger.debug(`CacheMethod: ${key} - cache hit`);

          return cachedValue;
        }
        const result = await original.apply(this, args);

        if (result) {
          this._logger.debug(`CacheMethod: ${key} - cache miss`);

          await this._cacheService.set(key, result, ttl);
        }

        return result;
      };
    } else {
      throw new Error('cache decorator can only be used on async methods');
    }
  };
}
