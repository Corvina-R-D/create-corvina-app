import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Context = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const response = ctx.switchToHttp().getResponse();
  return response.locals?.context;
});
