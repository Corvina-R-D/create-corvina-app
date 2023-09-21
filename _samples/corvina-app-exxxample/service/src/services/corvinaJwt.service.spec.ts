import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Installation } from '../entities/installation.entity';
import { getSequelizeModule } from '../modules/sequelize.module';
import { Logger } from '../utils/logger';
import { ArtifactService } from './artifact/artifact.service';
import { CacheService } from './cache.service';
import { CorvinaJwtService } from './corvinaJwt.service';
import { InstallationService } from './installation/installation.service';
import { OpenContainerService } from './openContainer/openContainer.service';
import { RepositoryService } from './repository.service';
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
          provide: 'IRepositoryService',
          useClass: RepositoryService,
        },
        ArtifactService,
        {
          provide: 'IRedisService',
          useClass: RedisService,
        },
        {
          provide: 'ICacheService',
          useClass: CacheService,
        },
        {
          provide: 'IOpenContainerService',
          useClass: OpenContainerService,
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

  it('If the jwt is wrong the validation result is false but if the jwt is valid the result is true', async () => {
    const installation = await installationService.create({
      apiVersion: '1',
      organizationId: randomUUID(),
      instanceId: randomUUID(),
      baseUrl: 'https://www.test.corvina.io',
      apiBaseUrl: 'https://www.api.test.corvina.io',
      authBaseUrl: 'https://www.auth.test.corvina.io',
      openIdConfigurationUrl: 'http://localhost:3943/auth/realms/sample1/.well-known/openid-configuration',
      wsBaseUrl: 'wss://test.corvina.io',
      clientId: 'sample1',
      clientSecret: 'sample1',
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
      expect(error.message).toBe('jwt must be provided');
    }

    // retrieve a valid token from fake-http-server
    const { access_token } = await (await fetch('http://localhost:3943/auth/realms/sample1/protocol/openid-connect/token')).json();

    const isValid = await service.validateBearerToken({
      token: access_token,
      instanceId: installation.instanceId,
      organizationId: installation.organizationId,
    });

    expect(isValid).toBeDefined();
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

  it('I cannot execute a validation if the openIdConfigurationUrl is not in whitelist', async () => {
    const openIdConfigurationUrl = 'https://www.notvalidnotvalid.nooooo.io/.well-known/openid-configuration';

    try {
      await service.validateBearerToken({
        token: '',
        openIdConfigurationUrl,
      });

      throw new Error('The test should not reach this point');
    } catch (error) {
      expect(error.message).toBe(`The openIdConfigurationUrl ${openIdConfigurationUrl} is not in the whitelist`);
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
