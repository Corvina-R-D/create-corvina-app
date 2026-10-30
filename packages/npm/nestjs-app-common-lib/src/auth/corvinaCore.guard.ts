import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ICorvinaToken } from './corvinaToken';
import { CORVINA_EVENT_TYPE as EVENT_TYPE, ICorvinaInstallationService, INSTALLATION_SERVICE } from './installation';
import { Logger } from '../utils/logger';
import { ICorvinaRequest, ICorvinaResponse } from './corvinaRequest';

/** body fields of the lifecycle events the guard reads */
interface ILifecycleEventBody {
  eventType?: string;
  instanceId?: string;
  organizationId?: string | number;
  orgResourceId?: string;
}

/**
 * After CorvinaAuthGuard, on the lifecycle API: allows only core, with the event and app scopes of the request
 * (event:<eventType>, app:<MANIFEST_ID>@<orgResourceId>).
 */
@Injectable()
export class CorvinaCoreGuard implements CanActivate {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly _MANIFEST_ID: string | undefined = process.env.MANIFEST_ID;

  private readonly _logger: Logger;

  private readonly _installationService: ICorvinaInstallationService;

  constructor(@Inject(Logger) logger: Logger, @Inject(INSTALLATION_SERVICE) installationService: ICorvinaInstallationService) {
    this._logger = logger;
    this._installationService = installationService;
  }

  private async getOrgResourceId(body: ILifecycleEventBody): Promise<string | undefined> {
    if (body.eventType === EVENT_TYPE.INSTALLED) return body.orgResourceId;

    const installation = await this._installationService.getInstallation({
      instanceId: body.instanceId as string,
      organizationId: String(body.organizationId),
    });

    return installation?.orgResourceId;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ICorvinaRequest & { body: ILifecycleEventBody }>();
    const response = context.switchToHttp().getResponse<ICorvinaResponse>();

    const corvinaToken: ICorvinaToken | undefined = request.corvinaToken ?? response.locals?.corvinaToken;

    if (!corvinaToken) {
      this._logger.error({ msg: `No validated bearer token in ${request.url}` });
      throw new UnauthorizedException('No bearer token');
    }

    const { azp, scope } = corvinaToken;

    if (!azp || azp !== 'core') {
      this._logger.error({ msg: `The API ${request.url} can be called only from core` });
      throw new UnauthorizedException(`The API can be called only from core`);
    }

    const scopeParts = (scope || '').split(' ');
    const eventScope = scopeParts.find((s) => s.startsWith('event:'));

    if (!eventScope) {
      throw new UnauthorizedException(`Unknown scopes in ${request.url}`);
    }

    return this.getOrgResourceId(request.body)
      .then((orgResourceId) => {
        const { eventType } = request.body;

        if (!orgResourceId && eventType === EVENT_TYPE.UNINSTALLED) {
          return true;
        }

        const appScope = scopeParts.find((s) => s.startsWith('app:'));

        if (eventScope !== `event:${eventType}`) {
          this._logger.error({ msg: `Event type ${eventType} does not match scope event type ${eventScope} in ${request.url}` });
          return false;
        }

        if (appScope !== `app:${this._MANIFEST_ID}@${orgResourceId}`) {
          this._logger.error({ msg: `App scope ${appScope} not matching expected app:${this._MANIFEST_ID}@${orgResourceId} in ${request.url}` });
          return false;
        }

        return true;
      })
      .catch((error) => {
        this._logger.error({ msg: `Unable to complete check on CorvinaCoreGuard in ${request.url}`, error });

        return request.body?.eventType === EVENT_TYPE.UNINSTALLED;
      });
  }
}
