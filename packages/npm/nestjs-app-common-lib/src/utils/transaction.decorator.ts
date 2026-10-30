/* eslint-disable no-param-reassign */
import { Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { isAsyncFunction } from './isAsyncFunction';

export interface ITransactionOptions {
  transaction?: Transaction;
}

export interface ISequelizeTransactionOptions {
  isolationLevel?: Transaction.ISOLATION_LEVELS;
}

/**
 * Runs an async method in a transaction, passed as { transaction } in its argument; a transaction already in the argument is reused.
 */
export function SequelizeTransaction(options: ISequelizeTransactionOptions = {}) {
  const { isolationLevel } = options;
  const injectSequelize = Inject(Sequelize);

  return function injectTransaction<T extends (...args: any[]) => Promise<any>>(target: object, _propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
    injectSequelize(target, '_sequelize');

    const original = descriptor?.value;

    if (!original || !isAsyncFunction(original)) {
      throw new Error('transaction(): decorator can only be used on async methods');
    }

    descriptor.value = async function pushTransactionArgument(this: { _sequelize?: Sequelize }, arg?: ITransactionOptions) {
      if (!this._sequelize) {
        throw new Error(`Sequelize is not defined`);
      }

      const a: ITransactionOptions = arg ? { ...arg } : {};

      if (a.transaction) {
        const result = await original.apply(this, [a]);
        return result;
      }

      const transaction = await this._sequelize.transaction({ isolationLevel });
      a.transaction = transaction;

      try {
        const result = await original.apply(this, [a]);
        await transaction.commit();
        return result;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } as T;
  };
}
