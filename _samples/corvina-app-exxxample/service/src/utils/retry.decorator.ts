/* eslint-disable no-param-reassign */
import { Inject } from '@nestjs/common';
import { Logger } from './logger';
import { IRetryOptions, retry } from './retry';

export const continueWhenCouldNotSerializeAccessDueToConcurrentUpdate = (nRetries: number, err: any) => {
  return {
    continue: err?.original?.code === '40001',
  };
};

export function Retry(options: IRetryOptions) {
  const { ms, nRetries, handleError, applyRandomToMs, name } = options || {};
  const injectLogger = Inject(Logger);

  return function injectCache(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectLogger(target, '_logger');

    if (typeof descriptor?.value !== 'function') {
      throw new Error('retry(): decorator can only be used on methods');
    }

    if (descriptor.value[Symbol.toStringTag] !== 'AsyncFunction') {
      throw new Error('retry(): decorator can only be used on async methods');
    }

    const original = descriptor.value;

    descriptor.value = async function execRetry(...args: any[]) {
      let result;

      const execOriginalAndSaveResult = async () => {
        result = await original.apply(this, args);
      };

      await retry(execOriginalAndSaveResult, { ms, nRetries, handleError, logger: this._logger, name: name || propertyKey, applyRandomToMs });

      return result;
    };
  };
}
