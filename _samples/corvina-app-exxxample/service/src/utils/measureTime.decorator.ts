import { Transaction } from 'sequelize';
import { Inject } from '@nestjs/common';
import { Logger } from './logger';

function getCircularReplacer() {
  const ancestors = [];
  /**
   * Prevents circular references in JSON.stringify and removes useless Sequelize transaction objects
   */
  return function replacerFn(key, value) {
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

export function MeasureTime(input?: { logArgs?: boolean }) {
  const injectLogger = Inject(Logger);

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original: (...args: Array<unknown>) => unknown = descriptor.value;
    injectLogger(target, '_logger');

    const { logArgs = true } = input || {};

    const timeLabelPrefix = `MeasureTime ${target.constructor.name}.${propertyKey}`;

    // eslint-disable-next-line no-param-reassign
    descriptor.value = async function wrapFunctionWithTimeMonitoring(...args: Array<unknown>) {
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
    };
  };
}
