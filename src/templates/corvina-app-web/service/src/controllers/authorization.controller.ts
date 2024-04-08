/* eslint-disable class-methods-use-this */
import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CorvinaAuthGuard } from '../guards/corvinaAuth.guard';
import { CorvinaInstallationRoleGuard } from '../guards/corvinaInstallationRole.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { RateLimiter } from '../guards/rateLimiter.guard';

@Controller('v1/')
@ApiTags('authorization')
@UseInterceptors(LoggingInterceptor)
export class AuthorizationController {
  @Get(':instanceId/:organizationId/check-auth')
  @ApiParam({ name: 'instanceId' })
  @ApiParam({ name: 'organizationId' })
[|- if .RedisEnabled |]
  @UseGuards(CorvinaAuthGuard, CorvinaInstallationRoleGuard, RateLimiter({ max: 5 }))
[|- else |]
  @UseGuards(CorvinaAuthGuard, CorvinaInstallationRoleGuard)
[|- end |]
  @ApiBearerAuth()
  async checkAuth(): Promise<undefined> {
    return undefined;
  }
}
