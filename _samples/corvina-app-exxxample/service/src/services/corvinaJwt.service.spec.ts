import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Installation } from '../entities/installation.entity';
import { getSequelizeModule } from '../modules/sequelize.module';
import { Logger } from '../utils/logger';
import { CacheService } from './cache.service';
import { CorvinaJwtService } from './corvinaJwt.service';
import { InstallationService } from './installation/installation.service';
import { RedisService } from './redis.service';

describe('CorvinaJwt', () => {
  let app: TestingModule;
  let service: CorvinaJwtService;
  let installationService: InstallationService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [...getSequelizeModule()],
      providers: [
        Logger,
        CorvinaJwtService,
        InstallationService,
        {
          provide: 'IRedisService',
          useClass: RedisService,
        },
        {
          provide: 'ICacheService',
          useClass: CacheService,
        },
      ],
    }).compile();
    await app.init();

    service = app.get<CorvinaJwtService>(CorvinaJwtService);

    installationService = app.get<InstallationService>(InstallationService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('I cannot verify a jwt if the openIdConfigurationUrl does not respond', async () => {
    const openIdConfigurationUrl = 'https://www.notvalidnotvalid.corvina.io/.well-known/openid-configuration';

    const installation = await installationService.create({
      apiVersion: '1',
      organizationId: randomUUID(),
      instanceId: randomUUID(),
      baseUrl: 'https://www.test.corvina.io',
      apiBaseUrl: 'https://www.api.test.corvina.io',
      authBaseUrl: 'https://www.auth.test.corvina.io',
      openIdConfigurationUrl,
      wsBaseUrl: 'wss://test.corvina.io',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      realm: 'exor',
      realmValidationRole: 'realmValidationRole-testing',
    } as Installation);

    expect(installation).not.toBeUndefined();

    try {
      await service.validateBearerToken({
        token: '',
        instanceId: installation.instanceId,
        organizationId: installation.organizationId,
      });

      throw new Error('The test should not reach this point');
    } catch (error) {
      expect(error.message).toBe(`Error calling ${openIdConfigurationUrl} : unable to retrieve open id conf 500 fetch failed`);
    }
  });

  it('I cannot verify a jwt for uninstalled organizationId', async () => {
    const instanceId = randomUUID();
    const organizationId = randomUUID();
    try {
      await service.validateBearerToken({
        token: 'whatever',
        instanceId,
        organizationId,
      });

      throw new Error('The test should not reach this point');
    } catch (error) {
      expect(error.message).toBe(`Unable to find installation for instanceId ${instanceId} and organizationId ${organizationId} during jwt validation`);
    }
  });
});
