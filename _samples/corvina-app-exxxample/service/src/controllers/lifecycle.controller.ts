import { Controller, Body, Post, UseInterceptors, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as semver from 'semver';
import { createInstallation, EVENT_TYPE, InstalledInputDTO, UninstalledInputDTO, BaseLifecycleDTO } from '../dtos/lifecycle.dto';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { IInstallationDeleteInput, InstallationService } from '../services/installation/installation.service';
import { matchUrl } from '../utils/matchUrl';
import { CorvinaAuthGuard } from '../guards/corvinaAuth.guard';
import { Logger } from '../utils/logger';
import { CustomError } from '../utils/CustomError';

@Controller('v1/')
@ApiTags('lifecycle')
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor)
@UseGuards(CorvinaAuthGuard)
export class LifecycleController {
  private readonly _logger: Logger;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly _MANIFEST_ID: string = process.env.MANIFEST_ID;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly _MANIFEST_API_VERSION = process.env.MANIFEST_API_VERSION.split('-')[1]; // chart-1.0.0

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _INSTALLATION_HOSTS_WHITELIST: string[] =
    process.env.INSTALLATION_HOSTS_WHITELIST === '*' ? null : process.env.INSTALLATION_HOSTS_WHITELIST.split(',');

  private readonly _installationService: InstallationService;

  constructor(installationService: InstallationService, logger: Logger) {
    this._installationService = installationService;
    this._logger = logger;
  }

  @Post('installed')
  async installed(@Body() body: InstalledInputDTO): Promise<string> {
    this.isEventForMeValidation(body);

    if (body.eventType !== EVENT_TYPE.INSTALLED) {
      throw new CustomError(501, `I'm the installation endpoint, I can process only the eventType ${EVENT_TYPE.INSTALLED}`, {
        INSTALLED: EVENT_TYPE.INSTALLED,
      });
    }

    const version = body.apiVersion;
    if (!semver.valid(version)) {
      throw new CustomError(502, `Invalid version ${version}, does not match the semver format`, { version });
    }

    if (semver.major(version) !== semver.major(this._MANIFEST_API_VERSION)) {
      throw new CustomError(503, `Invalid version ${version}, does not match the current major qversion ${this._MANIFEST_API_VERSION}`, {
        version,
        _MANIFEST_API_VERSION: this._MANIFEST_API_VERSION,
      });
    }

    this.validateAgainstWhitelist(body.baseUrl);

    this.validateAgainstWhitelist(body.apiBaseUrl);

    this.validateAgainstWhitelist(body.authBaseUrl);

    this.validateAgainstWhitelist(new URL(body.baseUrl).origin);

    await this._installationService.create(createInstallation(body));

    return 'OK';
  }

  @Post('uninstalled')
  @HttpCode(202)
  async uninstalled(@Body() body: UninstalledInputDTO): Promise<string> {
    this.isEventForMeValidation(body);

    if (body.eventType !== EVENT_TYPE.UNINSTALLED) {
      throw new CustomError(504, `I'm the uninstallation endpoint, I can process only the eventType ${EVENT_TYPE.UNINSTALLED}`, {
        UNINSTALLED: EVENT_TYPE.UNINSTALLED,
      });
    }

    this._installationService
      .delete({
        instanceId: body.instanceId,
        organizationId: String(body.organizationId),
      } as IInstallationDeleteInput)
      .then((output) => {
        if (!output.success) {
          this._logger.warn({ msg: 'Unable to complete uninstallation', body, output });
        } else {
          this._logger.info({ msg: 'Uninstallation completed successfully', body });
        }
      })
      .catch((error) => {
        this._logger.error({ msg: 'Unable to complete uninstallation', body, error });
      });

    return 'OK';
  }

  private isEventForMeValidation(body: BaseLifecycleDTO): void {
    if (body.key !== this._MANIFEST_ID) {
      throw new CustomError(505, `I'm ${this._MANIFEST_ID} application, I cannot process ${body.key}`, {
        key: body.key,
        _MANIFEST_ID: this._MANIFEST_ID,
      });
    }
  }

  private validateAgainstWhitelist(url: string): void {
    if (!this._INSTALLATION_HOSTS_WHITELIST) {
      return;
    }

    if (this._INSTALLATION_HOSTS_WHITELIST.some((rule) => matchUrl(url, rule))) {
      return;
    }

    throw new CustomError(506, `The url ${url} is not in the whitelist`, { url });
  }
}
