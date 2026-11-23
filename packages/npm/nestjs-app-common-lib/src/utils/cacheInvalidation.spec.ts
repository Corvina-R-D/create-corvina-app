import { invalidateCacheAfterCommit, IAfterCommitTransaction } from './cacheInvalidation';
import { ICacheService } from './cacheService';
import { ILogger } from './logger';
import { installationCacheKey } from '../auth/installation';

const memoryCache = (entries: Record<string, unknown>): ICacheService => {
  const values = new Map(Object.entries(entries));
  return {
    get: async <T>(key: string) => values.get(key) as T,
    set: async (key, value) => {
      values.set(key, value);
    },
    del: async (key) => {
      values.delete(key);
    },
  };
};

const logger = (): ILogger => ({ trace: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), fatal: jest.fn() });

/** a transaction that runs its afterCommit hooks on commit(), as sequelize does */
const fakeTransaction = () => {
  const hooks: (() => unknown)[] = [];
  const transaction: IAfterCommitTransaction & { commit(): Promise<void> } = {
    afterCommit: (fn) => {
      hooks.push(fn);
    },
    commit: async () => {
      await hooks.reduce(async (previous, hook) => {
        await previous;
        await hook();
      }, Promise.resolve());
    },
  };
  return transaction;
};

describe('invalidateCacheAfterCommit', () => {
  it('deletes the keys only once the transaction is committed', async () => {
    const cacheService = memoryCache({ a: 1, b: 2, c: 3 });
    const transaction = fakeTransaction();

    await invalidateCacheAfterCommit({ cacheService, keys: ['a', 'b'], logger: logger(), transaction });

    expect(await cacheService.get('a')).toBe(1);

    await transaction.commit();

    expect(await cacheService.get('a')).toBeUndefined();
    expect(await cacheService.get('b')).toBeUndefined();
    expect(await cacheService.get('c')).toBe(3);
  });

  it('deletes the keys now without a transaction', async () => {
    const cacheService = memoryCache({ a: 1 });

    await invalidateCacheAfterCommit({ cacheService, keys: ['a'], logger: logger() });

    expect(await cacheService.get('a')).toBeUndefined();
  });

  it('logs a cache failure instead of failing the commit, and deletes the other keys', async () => {
    const cacheService = memoryCache({ a: 1, b: 2 });
    const del = cacheService.del.bind(cacheService);
    cacheService.del = (key) => (key === 'a' ? Promise.reject(new Error('redis down')) : del(key));
    const log = logger();
    const transaction = fakeTransaction();

    await invalidateCacheAfterCommit({ cacheService, keys: ['a', 'b'], logger: log, transaction });

    await expect(transaction.commit()).resolves.toBeUndefined();
    expect(await cacheService.get('b')).toBeUndefined();
    expect(log.error).toHaveBeenCalledWith(expect.objectContaining({ key: 'a' }));
  });
});

describe('installationCacheKey', () => {
  it('is the same for a string and a numeric organizationId', () => {
    expect(installationCacheKey('instance', 5767)).toBe(installationCacheKey('instance', '5767'));
  });

  it('keeps the key format of the apps, so the deployed caches stay valid', () => {
    expect(installationCacheKey('instance', '5767')).toBe('getInstallation("instance","5767")');
  });
});
