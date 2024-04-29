import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ICorvinaJwtService } from '../services/corvinaJwt.service';
import { extractBearerToken } from '../utils/extractBearerToken';
import { Logger } from '../utils/logger';

const defaultExtraction = (
  request: any
): {
  instanceId: string;
  organizationId: string;
  openIdConfigurationUrl?: string;
} => {
  const { instanceId, organizationId, openIdConfigurationUrl } = request;

  // if openIdConfigurationUrl is setted it on request obejct, use it
  if (openIdConfigurationUrl) {
    return { instanceId, organizationId, openIdConfigurationUrl };
  }
  // if instanceId and organizationId are setted it on request obejct, use them
  if (instanceId && organizationId) {
    return { instanceId, organizationId, openIdConfigurationUrl: null };
  }

  // try to pick openIdConfigurationUrl from the request body (es. /installed)
  if (request.body?.openIdConfigurationUrl) {
    return {
      instanceId,
      organizationId,
      openIdConfigurationUrl: request.body?.openIdConfigurationUrl,
    };
  }

  const { url } = request;

  return {
    instanceId: url.split('/')[2],
    organizationId: url.split('/')[3],
    openIdConfigurationUrl,
  };
};

const EXTRACTION_FUNCTIONS = {
  artifactRegistryExtraction: defaultExtraction,
};

@Injectable()
export class CorvinaAuthGuard implements CanActivate {
  private readonly _corvinaJwtService: ICorvinaJwtService;

  private readonly _logger: Logger;

  private readonly _reflector: Reflector;

  constructor(@Inject('ICorvinaJwtService') corvinaJwtService: ICorvinaJwtService, @Inject(Logger) logger: Logger, reflector: Reflector) {
    this._corvinaJwtService = corvinaJwtService;
    this._logger = logger;
    this._reflector = reflector;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const bearerToken = extractBearerToken(request.headers?.authorization);

    if (!bearerToken) {
      this._logger.debug({ msg: 'No bearer token', api: request.url });
      throw new UnauthorizedException('No bearer token');
    }

    const extraction = this._reflector.get<string[]>('extract-instance-organization', context.getHandler())?.[0];

    this._logger.debug({ msg: 'Extraction', api: request.url, extraction });

    const extractionFn = EXTRACTION_FUNCTIONS[extraction] || defaultExtraction;

    const { instanceId, organizationId, openIdConfigurationUrl } = extractionFn(request);

    this._logger.debug({ msg: 'Extracted', api: request.url, instanceId, organizationId, openIdConfigurationUrl });

    return this._corvinaJwtService
      .validateBearerToken({
        token: bearerToken,
        instanceId,
        organizationId,
        openIdConfigurationUrl,
      })
      .then((corvinaToken) => {
        if (!corvinaToken) {
          this._logger.debug({ msg: 'Invalid bearer token', api: request.url });
          throw new UnauthorizedException('Invalid bearer token');
        }

        response.locals.corvinaToken = corvinaToken;
        response.locals.instanceId = instanceId;
        response.locals.organizationId = organizationId;

        return true;
      })
      .catch((error) => {
        this._logger.warn({ msg: 'Invalid bearer token', error, api: request.url });
        throw new UnauthorizedException(error.message);
      });
  }
}
