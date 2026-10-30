import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ICorvinaToken } from './corvinaJwt.service';
import { ICorvinaInstallation, ICorvinaInstallationService, INSTALLATION_SERVICE } from './installation';
import { IServiceContext } from './serviceContext';
import { Logger } from '../utils/logger';

const SERVICE_ACCOUNT_PREFIX = 'service-account-user-service-';

/** user name of the token, without the service account prefix */
export const getCorvinaUsername = (corvinaToken: ICorvinaToken): string => {
  if (corvinaToken.preferred_username.startsWith(SERVICE_ACCOUNT_PREFIX)) {
    return corvinaToken.preferred_username.replace(SERVICE_ACCOUNT_PREFIX, '');
  }
  return corvinaToken.preferred_username;
};

/**
 * After CorvinaAuthGuard: sets the IServiceContext (request.context and response.locals.context)
 * and allows the users with the realm validation role of the installation.
 */
@Injectable()
export class CorvinaInstallationRoleGuard implements CanActivate {
  protected readonly _logger: Logger;

  protected readonly _installationService: ICorvinaInstallationService;

  constructor(@Inject(INSTALLATION_SERVICE) installationService: ICorvinaInstallationService, @Inject(Logger) logger: Logger) {
    this._logger = logger;
    this._installationService = installationService;
  }

  /** whether the user can use the installation; it can add fields to the context */
  protected authorize(corvinaToken: ICorvinaToken, installation: ICorvinaInstallation, _context: IServiceContext): boolean | Promise<boolean> {
    this._logger.debug(`CorvinaInstallationRoleGuard: realmValidationRole: ${installation.realmValidationRole}`);

    if (!installation.realmValidationRole) {
      return false;
    }

    return corvinaToken.realm_access.roles.includes(installation.realmValidationRole);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const corvinaToken: ICorvinaToken = request.corvinaToken ?? response.locals?.corvinaToken;
    const instanceId: string = request.instanceId ?? response.locals?.instanceId;
    const organizationId: string = request.organizationId ?? response.locals?.organizationId;

    if (!corvinaToken) {
      throw new Error('No corvinaToken, this guard should be used after CorvinaAuthGuard');
    }

    if (!instanceId || !organizationId) {
      throw new Error('No instanceId or organizationId, this guard should be used after CorvinaAuthGuard');
    }

    const installation = await this._installationService.getInstallation({ instanceId, organizationId });

    if (!installation) {
      return false;
    }

    const serviceContext: IServiceContext = { installation, currentUser: getCorvinaUsername(corvinaToken) };

    request.context = serviceContext;

    if (response.locals) {
      response.locals.context = serviceContext;
    }

    return this.authorize(corvinaToken, installation, serviceContext);
  }
}
