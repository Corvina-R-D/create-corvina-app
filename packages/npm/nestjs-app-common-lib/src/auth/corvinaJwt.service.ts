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

const verify = async (token: string, getKey: jwt.GetPublicKeyOrSecret, options: jwt.VerifyOptions): Promise<ICorvinaToken> => {
  return new Promise<ICorvinaToken>((resolve, reject) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
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

const ONE_DAY = 60 * 60 * 24;
const ONE_WEEK = ONE_DAY * 7;
/** ms to wait for the openid configuration and the JWKS of a realm */
const FETCH_TIMEOUT = 5000;
/** JWKS requests per minute of a realm: a token with an unknown kid cannot flood the identity provider */
const JWKS_REQUESTS_PER_MINUTE = 10;

@Injectable()
export class CorvinaJwtService implements ICorvinaJwtService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly _INSTALLATION_HOSTS_WHITELIST: string[] | null;

  private readonly _logger: Logger;

  private readonly _installationService: ICorvinaInstallationService;

  private readonly _cacheService: ICacheService;

  /** one client per realm, so its rate limit applies to all the requests */
  private readonly _jwksClients = new Map<string, jwksClient.JwksClient>();

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
      response = await fetch(openIdConfigurationUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
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

    this._logger.debug({ openIdConfigurationUrl }, `Validating bearer token against`);

    return this.validateBearerTokenWithOpenIdConfigurationUrl({ token, openIdConfigurationUrl });
  }

  private async validateBearerTokenWithOpenIdConfigurationUrl({
    token,
    openIdConfigurationUrl,
  }: {
    token: string;
    openIdConfigurationUrl: string;
  }): Promise<ICorvinaToken> {
    const { issuer, jwks_uri: jwksUri } = await this.getOpenIdConfiguration(openIdConfigurationUrl);

    const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
      this.getSigningKey(jwksUri, header.kid).then(
        (key) => callback(null, key),
        (error) => callback(error)
      );
    };

    // the realm of the token must be the one of the installation: its keys could be cached for another realm
    const decoded = await verify(token, getKey, { issuer, algorithms: ['RS256'] });

    this._logger.trace(`Token verified : ${JSON.stringify(decoded)}`);

    return decoded;
  }

  /** public key of the realm, cached for a day */
  private async getSigningKey(jwksUri: string, kid: string | undefined): Promise<string> {
    const cacheKey = `jwks-${jwksUri}-${kid}`;

    try {
      const cached = await this._cacheService.get<string>(cacheKey);

      if (cached) {
        this._logger.debug(`Found key for ${kid} of ${jwksUri} in cache`);
        return cached;
      }
    } catch (error) {
      this._logger.warn({ msg: `Unable to read the key ${kid} of ${jwksUri} from cache`, error });
    }

    const key = await this.getJwksClient(jwksUri).getSigningKey(kid);
    const publicKey = key.getPublicKey();

    try {
      await this._cacheService.set(cacheKey, publicKey, ONE_DAY);
    } catch (error) {
      this._logger.warn({ msg: `Unable to cache the key ${kid} of ${jwksUri}`, error });
    }

    return publicKey;
  }

  private getJwksClient(jwksUri: string): jwksClient.JwksClient {
    let client = this._jwksClients.get(jwksUri);

    if (!client) {
      this._logger.debug(`Creating jwksClient with jwksUri ${jwksUri}`);

      client = jwksClient({
        jwksUri,
        cache: true,
        cacheMaxAge: ONE_DAY * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: JWKS_REQUESTS_PER_MINUTE,
        timeout: FETCH_TIMEOUT,
      });
      this._jwksClients.set(jwksUri, client);
    }

    return client;
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
