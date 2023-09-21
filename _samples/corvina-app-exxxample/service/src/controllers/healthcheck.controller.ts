import { Controller, Get } from '@nestjs/common';

@Controller('v1/health')
export class HealthCheckController {
  private readonly _ok = 'OK';

  @Get()
  ping(): string {
    return this._ok;
  }
}
