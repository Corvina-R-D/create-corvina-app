import { ExceptionFilter, Catch, ArgumentsHost, PayloadTooLargeException } from '@nestjs/common';
import { Response } from 'express';
import { CustomError } from '../utils/CustomError';
import { Logger } from '../utils/logger';

@Catch(Error)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly _logger: Logger;

  constructor() {
    this._logger = new Logger();
  }

  // eslint-disable-next-line
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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
    if ((error as any).getStatus && (error as any).getResponse) {
      const status = (error as any).getStatus();

      if (status === 404) {
        const request = ctx.getRequest();
        this._logger.warn({ msg: `404: ${request.method} ${request.url}`, headers: request.headers });
      }

      response.status(status).json((error as any).getResponse());
      return;
    }

    this._logger.error(error);

    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
