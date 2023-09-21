/* eslint-disable no-param-reassign */
import { Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import { Transaction as Tr } from 'sequelize';

export interface IOptions {
  transaction?: Transaction;
}

export interface ISequelizeTransactionOptions {
  isolationLevel?: Tr.ISOLATION_LEVELS;
}

/**
 * This decorator is used to inject an opject with a property that is a sequelize transaction as last argument in the method.
 */
export function SequelizeTransaction(options: ISequelizeTransactionOptions = {}) {
  const { isolationLevel } = options;
  const injectSequelize = Inject(Sequelize);

  return function injectTransaction(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectSequelize(target, '_sequelize');

    if (typeof descriptor?.value !== 'function' || descriptor.value[Symbol.toStringTag] !== 'AsyncFunction') {
      throw new Error('transaction(): decorator can only be used on async methods');
    }

    const original = descriptor.value;

    descriptor.value = async function pushTransactionArgument(arg?: IOptions) {
      if (!this._sequelize) {
        throw new Error(`Sequelize is not defined`);
      }

      const a = arg ? { ...arg } : {};

      if (a.transaction) {
        const result = await original.apply(this, [a]);
        return result;
      }

      a.transaction = await this._sequelize.transaction({ isolationLevel });

      try {
        const result = await original.apply(this, [a]);
        await a.transaction.commit();
        return result;
      } catch (error) {
        await a.transaction.rollback();
        throw error;
      }
    };
  };
}
