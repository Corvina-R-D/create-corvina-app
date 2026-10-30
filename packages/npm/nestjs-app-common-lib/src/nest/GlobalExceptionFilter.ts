import { ExceptionFilter, Catch, ArgumentsHost, HttpException, PayloadTooLargeException } from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { CustomError } from '../utils/CustomError';
import { Logger } from '../utils/logger';

/**
 * Maps CustomError to 400, NestJS exceptions to their status, anything else to 500.
 * Extend it and call super.catch() for the errors the app does not handle itself.
 */
/** the HTTP response as the filter writes it (an express Response is one) */
interface IJsonResponse {
  status(code: number): { json(body: unknown): unknown };
}

@Catch(Error)
export class GlobalExceptionFilter implements ExceptionFilter {
  protected readonly _logger: Logger;

  constructor() {
    this._logger = new Logger();
  }

  catch(error: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<IJsonResponse>();

    if (error instanceof PayloadTooLargeException) {
      response.status(413).json({
        errorCode: 1001,
        errorMessage: error.message,
      });
      return;
    }

    if (error instanceof CustomError) {
      response.status(400).json({
        errorMessage: error.message,
        errorCode: error.code,
        errorContext: error.context,
      });
      return;
    }

    // If the error is based on NestJS, we can get the status code and response
    if (error instanceof HttpException) {
      const status = error.getStatus();

      if (status === 404) {
        const request = ctx.getRequest<{ method: string; url: string; headers: IncomingHttpHeaders }>();
        this._logger.warn({ msg: `404: ${request.method} ${request.url}`, headers: request.headers });
      }

      response.status(status).json(error.getResponse());
      return;
    }

    this._logger.error(error);

    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
