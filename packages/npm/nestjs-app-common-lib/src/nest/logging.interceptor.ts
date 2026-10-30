import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from '../utils/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly _logger: Logger;

  constructor(logger: Logger) {
    this._logger = logger;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();

        this._logger.info({
          executionTime: Date.now() - now,
          url: request.url,
          method: request.method,
          statusCode: response.statusCode,
        });
      })
    );
  }
}
