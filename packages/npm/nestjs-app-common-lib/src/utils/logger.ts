import { Injectable } from '@nestjs/common';
import pino from 'pino';

/** pino options of Logger, also for the Nest bootstrap logger */
export const getLoggerOptions = (): pino.LoggerOptions => ({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: () => `, "time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label: string) => {
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

/** pino arguments: an object (fields, or an Error) or a message, then the message or its format arguments */
export type LogParams = [objOrMsg: unknown, ...args: unknown[]];

export interface ILogger {
  trace(...params: LogParams): void;
  debug(...params: LogParams): void;
  info(...params: LogParams): void;
  warn(...params: LogParams): void;
  error(...params: LogParams): void;
  fatal(...params: LogParams): void;
}

@Injectable()
export class Logger implements ILogger {
  private readonly _logger: pino.Logger;

  constructor() {
    this._logger = pino(getLoggerOptions(), loggerDestination);
  }

  trace(...params: LogParams): void {
    this._logger.trace(...(params as [unknown]));
  }

  debug(...params: LogParams): void {
    this._logger.debug(...(params as [unknown]));
  }

  info(...params: LogParams): void {
    this._logger.info(...(params as [unknown]));
  }

  warn(...params: LogParams): void {
    this._logger.warn(...(params as [unknown]));
  }

  error(...params: LogParams): void {
    this._logger.error(...(params as [unknown]));
  }

  fatal(...params: LogParams): void {
    this._logger.fatal(...(params as [unknown]));
  }
}
