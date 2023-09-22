import { Inject, Injectable } from '@nestjs/common';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';
import { matchUrl } from '../utils/matchUrl';
import { InstallationService } from './installation/installation.service';
import { ICacheService } from './cache.service';

const verify = async (token: string, secretOrPublicKey: jwt.Secret | jwt.GetPublicKeyOrSecret): Promise<ICorvinaToken> => {
  return new Promise<ICorvinaToken>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as ICorvinaToken);
      }
    });
  });
};

type ValidateBearerTokenInputOpenId = { token: string; openIdConfigurationUrl: string };
type ValidateBearerTokenInputInstanceIdOrgId = { token: string; instanceId: string; organizationId: string };

export type ValidateBearerTokenInput = ValidateBearerTokenInputInstanceIdOrgId | ValidateBearerTokenInputOpenId;

export interface ICorvinaJwtService {
  validateBearerToken(input: ValidateBearerTokenInput): Promise<ICorvinaToken>;
}

export interface ICorvinaToken {
  iss: string;
  aud: string;
  sub: string;
  azp: string;
  realm_access: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  scope?: string;
  exp: number;
  iat: number;
  jti: string;
  typ: string;
  email?: string;
  email_verified: boolean;
  preferred_username: string;
}

const ONE_WEEK = 60 * 60 * 24 * 7;

@Injectable()
export class CorvinaJwtService implements ICorvinaJwtService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _INSTALLATION_HOSTS_WHITELIST: string[] =
    process.env.INSTALLATION_HOSTS_WHITELIST === '*' ? null : process.env.INSTALLATION_HOSTS_WHITELIST.split(',');

  private readonly _logger: Logger;

  private readonly _installationService: InstallationService;

  private readonly _cacheService: ICacheService;

  constructor(logger: Logger, installationService: InstallationService, @Inject('ICacheService') cacheService: ICacheService) {
    this._logger = logger;
    this._installationService = installationService;
    this._cacheService = cacheService;
  }

  async validateBearerToken(input: ValidateBearerTokenInput): Promise<ICorvinaToken> {
    const { token } = input;

    let { openIdConfigurationUrl } = input as ValidateBearerTokenInputOpenId;

    if (!openIdConfigurationUrl) {
      const { instanceId, organizationId } = input as ValidateBearerTokenInputInstanceIdOrgId;

      if (!instanceId || !organizationId) {
        throw new Error(`Unable to validate bearer token, not enough information provided`);
      }

      const installation = await this._installationService.getInstallation({ instanceId, organizationId });

      if (!installation) {
        throw new Error(`Unable to find installation for instanceId ${instanceId} and organizationId ${organizationId} during jwt validation`);
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
    const { jwks_uri: jwksUri } = await this._installationService.getOpenIdConfiguration(openIdConfigurationUrl);

    this._logger.debug(`Creating jwksClient with jwksUri ${jwksUri}`);

    const client = jwksClient({ jwksUri });
    const cacheService = this._cacheService;
    const logger = this._logger;

    function getKey(header, callback) {
      cacheService.get(`jwks-${header.kid}`).then((value) => {
        if (value) {
          logger.debug(`Found key for ${header.kid} in cache`);
          return callback(null, value);
        }

        client.getSigningKey(header.kid, function getSigningKey(err: Error, key: jwksClient.SigningKey) {
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
