import { ArgumentsHost, BadRequestException, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { GlobalExceptionFilter } from './GlobalExceptionFilter';

describe('GlobalExceptionFilter', () => {
  const response = { status: jest.fn(), json: jest.fn() };
  const host = {
    switchToHttp: () => ({ getResponse: () => response, getRequest: () => ({ method: 'POST', url: '/items', headers: {} }) }),
  } as unknown as ArgumentsHost;
  let filter: GlobalExceptionFilter;
  let logError: jest.SpyInstance;
  let logWarn: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    response.status.mockReturnValue(response);
    filter = new GlobalExceptionFilter();
    logError = jest.spyOn((filter as any)._logger, 'error').mockImplementation(() => undefined);
    logWarn = jest.spyOn((filter as any)._logger, 'warn').mockImplementation(() => undefined);
  });

  it('logs the 5xx http exceptions as errors and returns their status and body', () => {
    const error = new ServiceUnavailableException('Unavailable for a reason');
    filter.catch(error, host);

    expect(logError).toHaveBeenCalledWith(expect.objectContaining({ err: error, status: 503 }), '503: POST /items');
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 503, message: 'Unavailable for a reason' }));

    filter.catch(new InternalServerErrorException(), host);
    expect(logError).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }), '500: POST /items');
  });

  it('logs the 404s as warnings and does not log the other 4xx', () => {
    filter.catch(new NotFoundException(), host);
    expect(logWarn).toHaveBeenCalledWith(expect.objectContaining({ msg: '404: POST /items' }));

    filter.catch(new BadRequestException('bad'), host);
    expect(logError).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenLastCalledWith(400);
  });

  it('logs the unexpected errors and hides them behind a 500', () => {
    const error = new Error('boom');
    filter.catch(error, host);

    expect(logError).toHaveBeenCalledWith(error);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ statusCode: 500, message: 'Internal server error' });
  });
});
