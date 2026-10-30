import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject, HttpException } from '@nestjs/common';
import { CORVINA_JWT_SERVICE, ICorvinaJwtService } from './corvinaJwt.service';
import { ICorvinaRequest, ICorvinaResponse } from './corvinaRequest';
import { extractBearerToken } from './extractBearerToken';
import { Logger } from '../utils/logger';

/** installation of the request, or the openid configuration to validate the token with */
export interface ICorvinaIds {
  instanceId?: string;
  organizationId?: string;
  openIdConfigurationUrl?: string | null;
}

/**
 * Validates the bearer token against the installation of the request.
 * The result goes in request.corvinaToken/instanceId/organizationId and in response.locals.
 * Subclasses change where the token and the installation ids come from, and the error returned.
 */
@Injectable()
export class CorvinaAuthGuard implements CanActivate {
  protected readonly _corvinaJwtService: ICorvinaJwtService;

  protected readonly _logger: Logger;

  constructor(@Inject(CORVINA_JWT_SERVICE) corvinaJwtService: ICorvinaJwtService, @Inject(Logger) logger: Logger) {
    this._corvinaJwtService = corvinaJwtService;
    this._logger = logger;
  }

  /** bearer token of the Authorization header */
  // eslint-disable-next-line class-methods-use-this
  protected extractToken(request: ICorvinaRequest): string | undefined {
    return extractBearerToken(request.headers?.authorization);
  }

  /** request fields set by a previous middleware, body.openIdConfigurationUrl (e.g. /installed), or /<x>/<instanceId>/<organizationId> */
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected extractIds(request: ICorvinaRequest, _context?: ExecutionContext): ICorvinaIds {
    const { instanceId, organizationId, openIdConfigurationUrl } = request;

    if (openIdConfigurationUrl) {
      return { instanceId, organizationId, openIdConfigurationUrl };
    }

    if (instanceId && organizationId) {
      return { instanceId, organizationId, openIdConfigurationUrl: null };
    }

    if (request.body?.openIdConfigurationUrl) {
      return { instanceId, organizationId, openIdConfigurationUrl: request.body.openIdConfigurationUrl };
    }

    const { url } = request;

    return {
      instanceId: url.split('/')[2],
      organizationId: url.split('/')[3],
      openIdConfigurationUrl,
    };
  }

  /** error thrown when the token is not valid */
  protected onError(error: unknown, request: ICorvinaRequest): HttpException {
    this._logger.warn({ msg: 'Invalid bearer token', error, api: request.url });

    if (error instanceof UnauthorizedException) {
      return error;
    }

    return new UnauthorizedException(error instanceof Error ? error.message : String(error));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ICorvinaRequest>();
    const response = context.switchToHttp().getResponse<ICorvinaResponse>();

    const bearerToken = this.extractToken(request);

    if (!bearerToken) {
      this._logger.debug({ msg: 'No bearer token', api: request.url });
      throw new UnauthorizedException('No bearer token');
    }

    const { instanceId, organizationId, openIdConfigurationUrl } = this.extractIds(request, context);

    this._logger.debug({ msg: 'Extracted', api: request.url, instanceId, organizationId, openIdConfigurationUrl });

    let corvinaToken;

    try {
      corvinaToken = await this._corvinaJwtService.validateBearerToken({ token: bearerToken, instanceId, organizationId, openIdConfigurationUrl });
    } catch (error) {
      throw this.onError(error, request);
    }

    if (!corvinaToken) {
      throw this.onError(new UnauthorizedException('Invalid bearer token'), request);
    }

    request.corvinaToken = corvinaToken;
    request.instanceId = instanceId;
    request.organizationId = organizationId;

    if (response.locals) {
      response.locals.corvinaToken = corvinaToken;
      response.locals.instanceId = instanceId;
      response.locals.organizationId = organizationId;
    }

    return true;
  }
}
