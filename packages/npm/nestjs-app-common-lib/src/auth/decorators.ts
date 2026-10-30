import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const fromRequest = (field: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const response = ctx.switchToHttp().getResponse();
  return request[field] ?? response.locals?.[field];
};

/** IServiceContext set by CorvinaInstallationRoleGuard */
export const Context = createParamDecorator((_: unknown, ctx: ExecutionContext) => fromRequest('context', ctx));

/** ICorvinaToken set by CorvinaAuthGuard */
export const CorvinaToken = createParamDecorator((_: unknown, ctx: ExecutionContext) => fromRequest('corvinaToken', ctx));
