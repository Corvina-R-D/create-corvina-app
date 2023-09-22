import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Installation } from '../../entities/installation.entity';
import { getSequelizeModule } from '../../modules/sequelize.module';
import { Logger } from '../../utils/logger';
import { ArtifactService } from '../artifact/artifact.service';
import { CacheService } from '../cache.service';
import { InstallationService } from './installation.service';
import { OpenContainerService } from '../openContainer/openContainer.service';
import { RepositoryService } from '../repository.service';
import { RedisService } from '../redis.service';

const INSTALLATION = {
  apiVersion: '1',
  organizationId: Math.ceil(Math.random() * 10000).toString(),
  instanceId: randomUUID(),
  baseUrl: 'https://www.test.corvina.io',
  apiBaseUrl: 'https://www.test.corvina.io',
  authBaseUrl: 'https://www.auth.test.corvina.io',
  openIdConfigurationUrl: 'https://www.auth.test.corvina.io/.well-known/openid-configuration',
  wsBaseUrl: 'wss://test.corvina.io',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  realm: 'exor',
  realmValidationRole: 'realmValidationRole-testing',
} as Installation;

describe('InstallationService', () => {
  let installationService: InstallationService;
  let app: TestingModule;
  let installation: Installation;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [...getSequelizeModule()],
      providers: [
        InstallationService,
        {
          provide: 'IRepositoryService',
          useClass: RepositoryService,
        },
        ArtifactService,
        Logger,
        {
          provide: 'ICacheService',
          useClass: CacheService,
        },
        {
          provide: 'IRedisService',
          useClass: RedisService,
        },
        {
          provide: 'IOpenContainerService',
          useClass: OpenContainerService,
        },
      ],
    }).compile();
    await app.init();

    installationService = app.get<InstallationService>(InstallationService);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    // create installation
    installation = await installationService.create(INSTALLATION);

    expect(installation).not.toBeUndefined();
    expect(installation.apiBaseUrl).toBe(INSTALLATION.apiBaseUrl);
    expect(installation.authBaseUrl).toBe(INSTALLATION.authBaseUrl);
  });

  it('I can run an uninstallation', async () => {
    await installationService.delete({
      instanceId: INSTALLATION.instanceId,
      organizationId: INSTALLATION.organizationId,
    } as Installation);
  });
});
