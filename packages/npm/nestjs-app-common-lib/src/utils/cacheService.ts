/** DI token of the ICacheService the app provides (redis or in memory) */
export const CACHE_SERVICE = 'ICacheService';

export interface ICacheService {
  get<T>(key: string): Promise<T | undefined>;
  /** ttl in seconds */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}
