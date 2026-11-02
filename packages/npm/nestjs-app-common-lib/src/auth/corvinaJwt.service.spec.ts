import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { generateKeyPairSync } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { CorvinaJwtService } from './corvinaJwt.service';
import { ICorvinaInstallation, ICorvinaInstallationService, InstallationNotFoundError } from './installation';
import { ICacheService } from '../utils/cacheService';
import { Logger } from '../utils/logger';

const KID = 'test-key';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });

const memoryCache = (): ICacheService => {
  const values = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => values.get(key) as T,
    set: async (key, value) => {
      values.set(key, value);
    },
    del: async (key) => {
      values.delete(key);
    },
  };
};

const jwk = (key: typeof publicKey) => ({ ...key.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' });

describe('CorvinaJwtService', () => {
  let server: Server;
  let baseUrl: string;
  let installations: Record<string, ICorvinaInstallation>;
  let service: CorvinaJwtService;
  let cache: ICacheService;
  let jwksRequests: number;

  const installationService: ICorvinaInstallationService = {
    getInstallation: async ({ instanceId, organizationId }) => installations[`${instanceId}/${organizationId}`] ?? null,
  };

  const createService = (whitelist: string) => {
    process.env.INSTALLATION_HOSTS_WHITELIST = whitelist;
    return new CorvinaJwtService(new Logger(), installationService, cache);
  };

  const sign = (payload: object = {}, key = privateKey, kid = KID) =>
    jwt.sign({ iss: baseUrl, preferred_username: 'user', realm_access: { roles: [] }, ...payload }, key, { algorithm: 'RS256', keyid: kid });

  beforeAll(async () => {
    server = createServer((req, res) => {
      res.setHeader('content-type', 'application/json');
      // two realms, the second one has another key with the same kid
      if (req.url === '/.well-known/openid-configuration') {
        res.end(JSON.stringify({ issuer: baseUrl, jwks_uri: `${baseUrl}/certs` }));
      } else if (req.url === '/same-keys/.well-known/openid-configuration') {
        res.end(JSON.stringify({ issuer: `${baseUrl}/same-keys`, jwks_uri: `${baseUrl}/certs` }));
      } else if (req.url === '/other/.well-known/openid-configuration') {
        res.end(JSON.stringify({ issuer: `${baseUrl}/other`, jwks_uri: `${baseUrl}/other/certs` }));
      } else if (req.url === '/certs') {
        jwksRequests += 1;
        res.end(JSON.stringify({ keys: [jwk(publicKey)] }));
      } else if (req.url === '/other/certs') {
        res.end(JSON.stringify({ keys: [jwk(other.publicKey)] }));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  beforeEach(() => {
    installations = {
      'i/o': { openIdConfigurationUrl: `${baseUrl}/.well-known/openid-configuration` },
      'i/other': { openIdConfigurationUrl: `${baseUrl}/other/.well-known/openid-configuration` },
      'i/same-keys': { openIdConfigurationUrl: `${baseUrl}/same-keys/.well-known/openid-configuration` },
    };
    jwksRequests = 0;
    cache = memoryCache();
    service = createService('*');
  });

  afterAll(async () => {
    delete process.env.INSTALLATION_HOSTS_WHITELIST;
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('cannot be created without INSTALLATION_HOSTS_WHITELIST', () => {
    expect(() => createService('')).toThrow('INSTALLATION_HOSTS_WHITELIST is required');
  });

  it('validates a token signed by the realm of the installation', async () => {
    const token = await service.validateBearerToken({ token: sign({ azp: 'core' }), instanceId: 'i', organizationId: 'o' });

    expect(token).toMatchObject({ azp: 'core', preferred_username: 'user' });
  });

  it('validates a token against an explicit openIdConfigurationUrl', async () => {
    const token = await service.validateBearerToken({ token: sign(), openIdConfigurationUrl: installations['i/o'].openIdConfigurationUrl });

    expect(token.preferred_username).toBe('user');
  });

  it('rejects a token signed by another key', async () => {
    const token = sign({}, other.privateKey);

    await expect(service.validateBearerToken({ token, instanceId: 'i', organizationId: 'o' })).rejects.toThrow('invalid signature');
  });

  it('rejects a token of another realm, even when its key is cached', async () => {
    const token = sign();
    await service.validateBearerToken({ token, instanceId: 'i', organizationId: 'o' });

    // same kid, another realm: its key is not the cached one
    await expect(service.validateBearerToken({ token, instanceId: 'i', organizationId: 'other' })).rejects.toThrow('invalid signature');
    await expect(service.validateBearerToken({ token: sign({ iss: `${baseUrl}/other` }), instanceId: 'i', organizationId: 'other' })).rejects.toThrow(
      'invalid signature'
    );
  });

  it('rejects a token issued by another realm', async () => {
    await expect(service.validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'same-keys' })).rejects.toThrow('jwt issuer invalid');
  });

  it('caches the keys of a realm', async () => {
    await service.validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'o' });
    await createService('*').validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'o' });

    expect(jwksRequests).toBe(1);
  });

  it('validates the token when the cache fails', async () => {
    cache.get = () => Promise.reject(new Error('redis down'));
    cache.set = () => Promise.reject(new Error('redis down'));

    await expect(service.validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'o' })).resolves.toMatchObject({ preferred_username: 'user' });
  });

  it('rate limits the JWKS requests of tokens with unknown kids', async () => {
    const validations = Array.from({ length: 20 }, (_, n) =>
      service.validateBearerToken({ token: sign({}, privateKey, `unknown-${n}`), instanceId: 'i', organizationId: 'o' }).catch((error) => error)
    );

    await Promise.all(validations);

    expect(jwksRequests).toBeLessThanOrEqual(10);
  });

  it('rejects a token of an uninstalled organization', async () => {
    const validation = service.validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'missing' });

    await expect(validation).rejects.toBeInstanceOf(InstallationNotFoundError);
    await expect(validation).rejects.toThrow('Unable to find installation for instanceId i and organizationId missing during jwt validation');
  });

  it('rejects an openid configuration out of the whitelist', async () => {
    service = createService('https://*.corvina.io/*');

    await expect(service.validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'o' })).rejects.toThrow('is not in the whitelist');
  });

  it('rejects when the openid configuration does not respond', async () => {
    installations['i/o'].openIdConfigurationUrl = `${baseUrl}/missing`;

    await expect(service.validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'o' })).rejects.toThrow('unable to retrieve open id conf 404');
  });
});
