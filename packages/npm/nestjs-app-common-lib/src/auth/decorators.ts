import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ICorvinaAuthResult, ICorvinaRequest, ICorvinaResponse } from './corvinaRequest';

const fromRequest = <K extends keyof ICorvinaAuthResult>(field: K, ctx: ExecutionContext): ICorvinaAuthResult[K] => {
  const request = ctx.switchToHttp().getRequest<ICorvinaRequest>();
  const response = ctx.switchToHttp().getResponse<ICorvinaResponse>();
  return request[field] ?? response.locals?.[field];
};

/** IServiceContext set by CorvinaInstallationRoleGuard */
export const Context = createParamDecorator((_: unknown, ctx: ExecutionContext) => fromRequest('context', ctx));

/** ICorvinaToken set by CorvinaAuthGuard */
export const CorvinaToken = createParamDecorator((_: unknown, ctx: ExecutionContext) => fromRequest('corvinaToken', ctx));
