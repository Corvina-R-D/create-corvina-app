import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IInstallationService } from '../services/installation/installation.service';
import { ICorvinaToken } from '../services/corvinaJwt.service';
import { Logger } from '../utils/logger';
import { IServiceContext } from '../dtos/serviceContext.dto';

const SERVICE_ACCOUNT_PREFIX = 'service-account-user-service-';
const getCorvinaUsername = (corvinaToken: ICorvinaToken): string => {
  if (corvinaToken.preferred_username.startsWith(SERVICE_ACCOUNT_PREFIX)) {
    return corvinaToken.preferred_username.replace(SERVICE_ACCOUNT_PREFIX, '');
  }
  return corvinaToken.preferred_username;
};

@Injectable()
export class CorvinaInstallationRoleGuard implements CanActivate {
  private readonly _logger: Logger;

  private readonly _installationService: IInstallationService;

  constructor(@Inject('IInstallationService') installationRepository: IInstallationService, @Inject(Logger) logger: Logger) {
    this._logger = logger;
    this._installationService = installationRepository;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const response = context.switchToHttp().getResponse();
    const corvinaToken = response.locals.corvinaToken as ICorvinaToken;
    const { instanceId, organizationId } = response.locals;

    if (!corvinaToken) {
      throw new Error('No corvinaToken, this guard should be used after CorvinaAuthGuard');
    }

    if (!instanceId || !organizationId) {
      throw new Error('No baseUrl or organizationId, this guard should be used after CorvinaAuthGuard');
    }

    return this._installationService.getInstallation({ instanceId, organizationId }).then((installation) => {
      this._logger.debug(`CorvinaInstallationRoleGuard: realmValidationRole: ${installation.realmValidationRole}`);

      if (!installation.realmValidationRole) {
        return false;
      }

      response.locals.context = {
        installation,
        currentUser: getCorvinaUsername(corvinaToken),
      } as IServiceContext;

      return corvinaToken.realm_access.roles.includes(installation.realmValidationRole);
    });
  }
}
