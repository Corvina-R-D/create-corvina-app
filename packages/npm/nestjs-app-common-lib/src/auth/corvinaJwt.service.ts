import { Inject, Injectable } from '@nestjs/common';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';
import { matchUrl } from '../utils/matchUrl';
import { CacheMethod } from '../utils/cache.decorator';
import { CACHE_SERVICE, ICacheService } from '../utils/cacheService';
import { ICorvinaInstallationService, INSTALLATION_SERVICE, InstallationNotFoundError } from './installation';
import { IOpenIDConfiguration } from './openIdConfiguration';
import { ICorvinaToken } from './corvinaToken';

/** DI token of the ICorvinaJwtService */
export const CORVINA_JWT_SERVICE = 'ICorvinaJwtService';

const verify = async (token: string, secretOrPublicKey: jwt.Secret | jwt.GetPublicKeyOrSecret): Promise<ICorvinaToken> => {
  return new Promise<ICorvinaToken>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as unknown as ICorvinaToken);
      }
    });
  });
};

export interface IValidateBearerTokenInput {
  token: string;
  /** installation of the token realm, without openIdConfigurationUrl */
  instanceId?: string;
  organizationId?: string;
  /** openid configuration of the token realm: instanceId and organizationId are not needed */
  openIdConfigurationUrl?: string | null;
}

/** @deprecated use IValidateBearerTokenInput */
export type ValidateBearerTokenInput = IValidateBearerTokenInput;

export interface ICorvinaJwtService {
  /** the decoded token; rejects when the token is not valid for the installation */
  validateBearerToken(input: IValidateBearerTokenInput): Promise<ICorvinaToken>;
  /** openid configuration of an installation realm (e.g. its token_endpoint) */
  getOpenIdConfiguration(openIdConfigurationUrl: string): Promise<IOpenIDConfiguration>;
}

const ONE_WEEK = 60 * 60 * 24 * 7;

@Injectable()
export class CorvinaJwtService implements ICorvinaJwtService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly _INSTALLATION_HOSTS_WHITELIST: string[] | null;

  private readonly _logger: Logger;

  private readonly _installationService: ICorvinaInstallationService;

  private readonly _cacheService: ICacheService;

  constructor(
    @Inject(Logger) logger: Logger,
    @Inject(INSTALLATION_SERVICE) installationService: ICorvinaInstallationService,
    @Inject(CACHE_SERVICE) cacheService: ICacheService
  ) {
    const whitelist = process.env.INSTALLATION_HOSTS_WHITELIST;

    if (!whitelist) {
      throw new Error('INSTALLATION_HOSTS_WHITELIST is required: comma separated url patterns of the allowed openid configurations, * for any');
    }

    this._INSTALLATION_HOSTS_WHITELIST = whitelist === '*' ? null : whitelist.split(',');
    this._logger = logger;
    this._installationService = installationService;
    this._cacheService = cacheService;
  }

  /** openid configuration of the installation realm, cached for a week */
  @CacheMethod({ ttl: ONE_WEEK })
  public async getOpenIdConfiguration(openIdConfigurationUrl: string): Promise<IOpenIDConfiguration> {
    this._logger.debug(`Getting open id conf client for ${openIdConfigurationUrl}`);

    let response: Response;

    try {
      response = await fetch(openIdConfigurationUrl);
    } catch (error) {
      const { message, cause } = error as Error;
      this._logger.error(`Error getting open id conf client for ${openIdConfigurationUrl}: ${message} : ${cause}`);
      throw new Error(`Error calling ${openIdConfigurationUrl} : unable to retrieve open id conf 500 ${message}`);
    }

    if (!response.ok) {
      throw new Error(`Error calling ${openIdConfigurationUrl} : unable to retrieve open id conf ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as IOpenIDConfiguration;
  }

  async validateBearerToken(input: IValidateBearerTokenInput): Promise<ICorvinaToken> {
    const { token, instanceId, organizationId } = input;

    let { openIdConfigurationUrl } = input;

    if (!openIdConfigurationUrl) {
      if (!instanceId || !organizationId) {
        throw new Error(`Unable to validate bearer token, not enough information provided`);
      }

      const installation = await this._installationService.getInstallation({ instanceId, organizationId });

      if (!installation) {
        throw new InstallationNotFoundError(
          `Unable to find installation for instanceId ${instanceId} and organizationId ${organizationId} during jwt validation`
        );
      }

      openIdConfigurationUrl = installation.openIdConfigurationUrl;
    }

    this.validateAgainstWhitelist(openIdConfigurationUrl);

    this._logger.debug({ token, openIdConfigurationUrl }, `Validating bearer token against`);

    return this.validateBearerTokenWithOpenIdConfigurationUrl({ token, openIdConfigurationUrl });
  }

  private async validateBearerTokenWithOpenIdConfigurationUrl({
    token,
    openIdConfigurationUrl,
  }: {
    token: string;
    openIdConfigurationUrl: string;
  }): Promise<ICorvinaToken> {
    const { jwks_uri: jwksUri } = await this.getOpenIdConfiguration(openIdConfigurationUrl);

    this._logger.debug(`Creating jwksClient with jwksUri ${jwksUri}`);

    const client = jwksClient({ jwksUri });
    const cacheService = this._cacheService;
    const logger = this._logger;

    function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
      cacheService.get<string>(`jwks-${header.kid}`).then((value) => {
        if (value) {
          logger.debug(`Found key for ${header.kid} in cache`);
          return callback(null, value);
        }

        client.getSigningKey(header.kid, function getSigningKey(err: Error | null, key?: jwksClient.SigningKey) {
          logger.debug(`Getting key ${key} for ${header.kid} from jwks client`);

          if (err) {
            logger.error(err);
            callback(err);
          } else if (!key) {
            const message = `Unable to find key for kid ${header.kid}`;
            logger.error(message);
            callback(new Error(message));
          } else {
            const signingKey = key.getPublicKey();

            cacheService.set(`jwks-${header.kid}`, signingKey, ONE_WEEK);

            callback(null, signingKey);
          }
        });

        return undefined;
      });
    }

    const decoded = await verify(token, getKey);

    this._logger.trace(`Token verified : ${JSON.stringify(decoded)}`);

    return decoded;
  }

  private validateAgainstWhitelist(url: string): void {
    if (!this._INSTALLATION_HOSTS_WHITELIST) {
      return;
    }

    if (this._INSTALLATION_HOSTS_WHITELIST.some((rule) => matchUrl(url, rule))) {
      return;
    }

    throw new Error(`The url ${url} is not in the whitelist`);
  }
}
