/* eslint-disable no-param-reassign */
import { Inject } from '@nestjs/common';
import { Logger } from './logger';
import { IRetryOptions, retry } from './retry';
import { isAsyncFunction } from './isAsyncFunction';

/** handleError of Retry: retries the postgres serialization failures (40001) only */
export const continueWhenCouldNotSerializeAccessDueToConcurrentUpdate = (_nRetries: number, err: unknown) => {
  return {
    continue: (err as { original?: { code?: string } } | undefined)?.original?.code === '40001',
  };
};

export function Retry(options: IRetryOptions) {
  const { ms, nRetries, handleError, applyRandomToMs, name } = options || {};
  const injectLogger = Inject(Logger);

  return function injectRetry<T extends (...args: any[]) => Promise<any>>(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
    injectLogger(target, '_logger');

    const original = descriptor?.value;

    if (typeof original !== 'function') {
      throw new Error('retry(): decorator can only be used on methods');
    }

    if (!isAsyncFunction(original)) {
      throw new Error('retry(): decorator can only be used on async methods');
    }

    descriptor.value = async function execRetry(this: { _logger: Logger }, ...args: Parameters<T>) {
      let result: Awaited<ReturnType<T>> | undefined;

      const execOriginalAndSaveResult = async () => {
        result = await original.apply(this, args);
      };

      await retry(execOriginalAndSaveResult, { ms, nRetries, handleError, logger: this._logger, name: name || propertyKey, applyRandomToMs });

      return result;
    } as T;
  };
}
