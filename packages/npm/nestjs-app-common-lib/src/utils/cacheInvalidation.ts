import { ICacheService } from './cacheService';
import { ILogger } from './logger';

/** the part of a sequelize Transaction the invalidation uses */
export interface IAfterCommitTransaction {
  afterCommit(fn: () => unknown): void;
}

export interface IInvalidateCacheInput {
  cacheService: ICacheService;
  keys: string[];
  logger: ILogger;
  /** the transaction that changes the cached data: the keys are deleted once it is committed, now without one */
  transaction?: IAfterCommitTransaction;
}

const deleteKeys = async ({ cacheService, keys, logger }: IInvalidateCacheInput): Promise<void> => {
  // the data is already changed: a cache failure is logged, it must not fail the change
  await Promise.all(
    keys.map(async (key) => {
      try {
        logger.debug({ msg: 'invalidating cache', key });
        await cacheService.del(key);
      } catch (error) {
        logger.error({ msg: 'Unable to invalidate the cache', key, error });
      }
    })
  );
};

/**
 * Deletes cache keys after the transaction that changes their data is committed.
 * Deleted before, a concurrent read could still see the old data (e.g. an uninstalled installation) and cache it again.
 * Errors are logged, never thrown: thrown in an afterCommit hook, they would make the commit of the transaction reject.
 */
export const invalidateCacheAfterCommit = async (input: IInvalidateCacheInput): Promise<void> => {
  const { transaction } = input;

  if (transaction) {
    transaction.afterCommit(() => deleteKeys(input));
    return;
  }

  await deleteKeys(input);
};
