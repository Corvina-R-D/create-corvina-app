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

const noCache: ICacheService = {
  get: async () => undefined,
  set: async () => undefined,
  del: async () => undefined,
};

describe('CorvinaJwtService', () => {
  let server: Server;
  let baseUrl: string;
  let installations: Record<string, ICorvinaInstallation>;
  let service: CorvinaJwtService;

  const installationService: ICorvinaInstallationService = {
    getInstallation: async ({ instanceId, organizationId }) => installations[`${instanceId}/${organizationId}`] ?? null,
  };

  const createService = (whitelist: string) => {
    process.env.INSTALLATION_HOSTS_WHITELIST = whitelist;
    return new CorvinaJwtService(new Logger(), installationService, noCache);
  };

  const sign = (payload: object = {}) =>
    jwt.sign({ preferred_username: 'user', realm_access: { roles: [] }, ...payload }, privateKey, { algorithm: 'RS256', keyid: KID });

  beforeAll(async () => {
    server = createServer((req, res) => {
      res.setHeader('content-type', 'application/json');
      if (req.url === '/.well-known/openid-configuration') {
        res.end(JSON.stringify({ issuer: baseUrl, jwks_uri: `${baseUrl}/certs` }));
      } else if (req.url === '/certs') {
        res.end(JSON.stringify({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' }] }));
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
    installations = { 'i/o': { openIdConfigurationUrl: `${baseUrl}/.well-known/openid-configuration` } };
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
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    const token = jwt.sign({}, other, { algorithm: 'RS256', keyid: KID });

    await expect(service.validateBearerToken({ token, instanceId: 'i', organizationId: 'o' })).rejects.toThrow('invalid signature');
  });

  it('rejects a token of an uninstalled organization', async () => {
    const validation = service.validateBearerToken({ token: sign(), instanceId: 'i', organizationId: 'other' });

    await expect(validation).rejects.toBeInstanceOf(InstallationNotFoundError);
    await expect(validation).rejects.toThrow('Unable to find installation for instanceId i and organizationId other during jwt validation');
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
