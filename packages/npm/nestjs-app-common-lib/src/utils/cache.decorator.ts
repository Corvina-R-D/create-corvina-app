/* eslint-disable no-param-reassign */
import { Inject } from '@nestjs/common';
import { Logger } from './logger';
import { CACHE_SERVICE, ICacheService } from './cacheService';
import { isAsyncFunction } from './isAsyncFunction';

export interface ICacheMethodOptions {
  prefix?: string;
  /** seconds */
  ttl?: number;
  keyBuilder?: (args: any[]) => string;
}

/** fields the decorator injects in the class */
interface ICacheMethodHost {
  _cacheService?: ICacheService;
  _logger: Logger;
}

/**
 * Key CacheMethod caches a call under when the method has no keyBuilder: `<prefix><method>(<JSON of each arg>,...)`.
 * Use it to delete (invalidate) a cached call, instead of rebuilding the key by hand.
 */
export const cacheMethodKey = (methodName: string, args: unknown[], prefix = ''): string =>
  `${prefix}${methodName}(${args.map((arg) => JSON.stringify(arg)).join(',')})`;

/**
 * This decorator is used to cache the result of a method.
 * The cache key is the method name and the arguments. You can also specify a custom key prefix.
 */
export function CacheMethod({ prefix, ttl, keyBuilder }: ICacheMethodOptions = {}) {
  const injectCacheManager = Inject(CACHE_SERVICE);
  const injectLogger = Inject(Logger);

  return function injectCache<T extends (...args: any[]) => Promise<any>>(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
    injectCacheManager(target, '_cacheService');
    injectLogger(target, '_logger');

    const original = descriptor?.value;

    if (!original || !isAsyncFunction(original)) {
      throw new Error('cache decorator can only be used on async methods');
    }

    descriptor.value = async function cachedMethod(this: ICacheMethodHost, ...args: Parameters<T>) {
      if (!this._cacheService) {
        throw new Error(`CacheManager is not defined`);
      }

      const key = keyBuilder ? keyBuilder(args) : cacheMethodKey(propertyKey, args, prefix);

      let cachedValue: Awaited<ReturnType<T>> | undefined;

      // a cache failure (e.g. redis down) calls the method instead of failing it
      try {
        cachedValue = await this._cacheService.get<Awaited<ReturnType<T>>>(key);
      } catch (error) {
        this._logger.warn({ msg: `CacheMethod: ${key} - unable to read the cache`, error });
      }

      if (cachedValue) {
        this._logger.debug(`CacheMethod: ${key} - cache hit`);

        return cachedValue;
      }
      const result = await original.apply(this, args);

      if (result) {
        this._logger.debug(`CacheMethod: ${key} - cache miss`);

        try {
          await this._cacheService.set(key, result, ttl);
        } catch (error) {
          this._logger.warn({ msg: `CacheMethod: ${key} - unable to write the cache`, error });
        }
      }

      return result;
    } as T;
  };
}
