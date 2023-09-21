/* eslint-disable no-param-reassign */
import { CanActivate, ExecutionContext, HttpException, Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import { IRateLimiterService } from '../services/rateLimiter.service';

export interface IRateLimiterGuardOptions {
  max: number;
  getIdentifier?: (request: Request, response: Response) => string;
}

export const CURRENT_USER_REQUEST_IDENTIFIER = (request: Request, response: Response): string => {
  const { currentUser } = response.locals.context;
  const { method, baseUrl, path } = request;

  if (!currentUser) {
    throw new HttpException({ errorMessage: `No user in context for API ${method}-${baseUrl}-${path}` }, 500);
  }

  return `${currentUser}:${method}-${baseUrl}-${path}`;
};

export const REQUEST_IDENTIFIER = (request: Request): string => {
  const { method, baseUrl, path } = request;

  return `ND:${method}-${baseUrl}-${path}`;
};

/**
 * Rate limiter guard
 * @param options max: number of requests in the time window (1sec), getIdentifier: function that returns a string identifier for the rate limiter (default: currentUser:method-baseUrl-path)
 * @returns 429 if rate limit exceeded
 */
export const RateLimiter = (options: IRateLimiterGuardOptions): any => {
  const { max, getIdentifier = CURRENT_USER_REQUEST_IDENTIFIER } = options || {};

  @Injectable()
  class RateLimiterGuard implements CanActivate {
    private readonly _rateLimiterService: IRateLimiterService;

    private readonly _logger: Logger;

    constructor(@Inject('IRateLimiterService') rateLimiterService: IRateLimiterService, @Inject(Logger) logger: Logger) {
      this._rateLimiterService = rateLimiterService;
      this._logger = logger;
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
      const request: Request = context.switchToHttp().getRequest();
      const response: Response = context.switchToHttp().getResponse();

      const identifier = getIdentifier(request, response);
      this._logger.trace(`Rate limit check for ${identifier} (${max})`);

      return this._rateLimiterService.incr(identifier, { max }).then(({ canDo, count }) => {
        if (!canDo) {
          this._logger.warn(`Rate limit exceeded for ${identifier} (${count}/${max})`);
          throw new HttpException({ errorMessage: `Rate limit exceeded for ${identifier} (${count}/${max})` }, 429);
        }

        this._logger.trace(`Rate limit passed for ${identifier} (${count}/${max})`);
        return true;
      });
    }
  }

  return RateLimiterGuard;
};
