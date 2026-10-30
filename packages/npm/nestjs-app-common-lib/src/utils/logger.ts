import { Injectable } from '@nestjs/common';
import pino from 'pino';

/** pino options of Logger, also for the Nest bootstrap logger */
export const getLoggerOptions = () => ({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: () => `, "time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  // Error fields serialized with message and stack: an Error has no enumerable properties, so it would log as {}
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});
/** pino destination of Logger: the LOG_TO_FILE file, stdout when unset */
export const loggerDestination = process.env.LOG_TO_FILE ? pino.destination(process.env.LOG_TO_FILE) : undefined;

export interface ILogger {
  trace(...params): void;
  debug(...params): void;
  info(...params): void;
  warn(...params): void;
  error(...params): void;
  fatal(...params): void;
}

@Injectable()
export class Logger implements ILogger {
  private _logger;

  constructor() {
    this._logger = pino(getLoggerOptions(), loggerDestination);
  }

  trace(...params): void {
    this._logger.trace(...params);
  }

  debug(...params): void {
    this._logger.debug(...params);
  }

  info(...params): void {
    this._logger.info(...params);
  }

  warn(...params): void {
    this._logger.warn(...params);
  }

  error(...params): void {
    this._logger.error(...params);
  }

  fatal(...params): void {
    this._logger.fatal(...params);
  }
}
