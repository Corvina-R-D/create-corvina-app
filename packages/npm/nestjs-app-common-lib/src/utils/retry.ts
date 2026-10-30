import { setTimeout } from 'timers/promises';
import { ILogger } from './logger';

export interface IRetryOptions {
  nRetries: number;
  ms: number;
  applyRandomToMs?: boolean;
  logger?: ILogger;
  name?: string;
  // if you want to handle the error yourself and decide if you want to continue or not
  handleError?: (nRetries: number, err: Error) => { continue: boolean; avoidRethrow?: boolean };
}

const DEFAULT_ERROR_HANDLER = () => ({ continue: true, avoidRethrow: false });

export async function retry(fn: Function, { nRetries, ms, applyRandomToMs, logger, handleError, name }: IRetryOptions) {
  const handleErrorFn = handleError || DEFAULT_ERROR_HANDLER;
  const fnId = name || fn.name;
  if (nRetries > 0) {
    try {
      await fn();
    } catch (err) {
      logger?.error(err);

      const handleErrResult = handleErrorFn(nRetries, err);
      if (!handleErrResult.continue && handleErrResult.avoidRethrow) {
        return;
      }
      if (!handleErrResult.continue) {
        throw err;
      }

      const nextNumberOfRetries = nRetries - 1;
      const realMs = applyRandomToMs ? Math.random() * ms : ms;
      logger?.info(`retry: ${fnId} Tries remaining #${nextNumberOfRetries}, Delay ${realMs / 1000} sec, ${new Date().toISOString()}`);
      await setTimeout(ms);
      await retry(fn, { nRetries: nextNumberOfRetries, ms: realMs, logger, name, handleError, applyRandomToMs });
    }
  }
  if (nRetries === 0) {
    throw new Error(`retry ${fnId}: Failed retrying too many attempts`);
  } else {
    logger?.info(`retry: ${fnId} executed correctly`);
  }
}
