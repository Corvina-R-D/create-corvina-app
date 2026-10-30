import { Transaction } from 'sequelize';
import { Inject } from '@nestjs/common';
import { Logger } from './logger';

function getCircularReplacer() {
  const ancestors: unknown[] = [];
  /**
   * Prevents circular references in JSON.stringify and removes useless Sequelize transaction objects
   */
  return function replacerFn(this: unknown, _key: string, value: unknown) {
    if (value instanceof Transaction) {
      return '[Transaction]';
    }

    if (typeof value !== 'object' || value === null) {
      return value;
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return '[Circular]';
    }
    ancestors.push(value);
    return value;
  };
}

/** logs the execution time of the method (also async), with its arguments unless logArgs is false */
export function MeasureTime(input?: { logArgs?: boolean }) {
  const injectLogger = Inject(Logger);

  return <T extends (...args: any[]) => any>(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => {
    const original = descriptor.value as T;
    injectLogger(target, '_logger');

    const { logArgs = true } = input || {};

    const timeLabelPrefix = `MeasureTime ${target.constructor.name}.${propertyKey}`;

    // eslint-disable-next-line no-param-reassign
    descriptor.value = function wrapFunctionWithTimeMonitoring(this: { _logger: Logger }, ...args: Parameters<T>) {
      const timeLabel: string = logArgs ? `${timeLabelPrefix}(${JSON.stringify(args, getCircularReplacer())})` : timeLabelPrefix;
      const now = Date.now();
      const value: unknown = original.apply(this, args);

      // check if the value is a promise
      if (value instanceof Promise) {
        return value.then((result) => {
          this._logger.info({ executionTime: Date.now() - now, msg: timeLabel });
          return result;
        });
      }

      this._logger.info({ executionTime: Date.now() - now, msg: timeLabel });

      return value;
    } as T;
  };
}
