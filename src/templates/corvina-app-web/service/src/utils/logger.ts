import { Injectable } from '@nestjs/common';
// const pino = require("pino");
import pino from 'pino';

const getOptions = () => ({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: () => `, "time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});
const destination = process.env.LOG_TO_FILE ? pino.destination(process.env.LOG_TO_FILE) : undefined;

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
    this._logger = pino(getOptions(), destination);
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
