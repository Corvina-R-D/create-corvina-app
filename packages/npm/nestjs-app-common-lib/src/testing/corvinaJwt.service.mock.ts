import { Injectable } from '@nestjs/common';
import { ICorvinaJwtService } from '../auth/corvinaJwt.service';
import { ICorvinaToken } from '../auth/corvinaToken';
import { IOpenIDConfiguration } from '../auth/openIdConfiguration';

export const INVALID_TOKEN = 'invalid-token';

@Injectable()
export class CorvinaJwtServiceMock implements ICorvinaJwtService {
  // eslint-disable-next-line class-methods-use-this
  async validateBearerToken({ token }: { token: string; instanceId: string; organizationId: string }): Promise<ICorvinaToken> {
    if (token === INVALID_TOKEN) {
      throw new Error('Invalid token');
    }

    return {
      iss: 'https://corvina-dev.auth0.com/',
      aud: 'https://corvina-dev.auth0.com/api/v2/',
      sub: 'auth0|5e7f9b9b0b5b9b0b5b9b0b5b',
      azp: 'azp',
      realm_access: {
        roles: ['admin', 'realmValidationRole-testing'],
      },
      resource_access: {
        'https://corvina-dev.auth0.com/api/v2/': {
          roles: ['read:users', 'read:roles', 'read:clients'],
        },
      },
      scope: 'read:users read:roles read:clients',
      exp: 1585000000,
      iat: 1585000000,
      jti: 'jti',
      typ: 'typ',
      email: 'email',
      email_verified: true,
      preferred_username: 'preferred_username',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async getOpenIdConfiguration(openIdConfigurationUrl: string): Promise<IOpenIDConfiguration> {
    const issuer = openIdConfigurationUrl.replace('/.well-known/openid-configuration', '');

    return {
      issuer,
      authorization_endpoint: `${issuer}/protocol/openid-connect/auth`,
      token_endpoint: `${issuer}/protocol/openid-connect/token`,
      jwks_uri: `${issuer}/protocol/openid-connect/certs`,
    };
  }
}
