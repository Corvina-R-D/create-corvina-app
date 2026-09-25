import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Installation } from '../../entities/installation.entity';
import { getSequelizeModule } from '../../modules/sequelize.module';
import { Logger } from '../../utils/logger';
import { CacheService } from '../cache.service';
import { InstallationService } from './installation.service';
import { RedisService } from '../redis.service';
import { setPaymentPlans } from '../../dtos/general-info/paymentPlan.dto';

const TEST_PAYMENT_PLANS = [
  {
    id: 'first',
    label: { value: 'First tier', i18n: '' },
    description: { value: 'First tier', i18n: '' },
    level: 1,
    amount: 100,
    recurrent: { period: '1Y', amount: 100 },
    options: [],
    deprecated: false,
  },
];

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
        Logger,
        {
          provide: 'ICacheService',
          useClass: CacheService,
        },
        {
          provide: 'IRedisService',
          useClass: RedisService,
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

  it('installation without an explicit endDate resolves one from the matching payment plan', async () => {
    setPaymentPlans(TEST_PAYMENT_PLANS);

    const installed = await installationService.create({
      ...INSTALLATION,
      instanceId: randomUUID(),
      planId: 'first',
    } as Installation);

    expect(installed.planId).toBe('first');
    expect(installed.freeTrial).toBe(false);
    expect(installed.endDate).not.toBeUndefined();

    setPaymentPlans([]);
  });

  it('renew rejects an endDate earlier than the current one', async () => {
    const renewable = await installationService.create({
      ...INSTALLATION,
      instanceId: randomUUID(),
      endDate: new Date('2050-01-01T00:00:00Z'),
    } as Installation);

    await installationService.renew({
      instanceId: renewable.instanceId,
      organizationId: renewable.organizationId,
      endDate: new Date('2060-01-01T00:00:00Z'),
      planId: undefined,
      freeTrial: false,
    });

    await expect(
      installationService.renew({
        instanceId: renewable.instanceId,
        organizationId: renewable.organizationId,
        endDate: new Date('2030-01-01T00:00:00Z'),
        planId: undefined,
        freeTrial: false,
      })
    ).rejects.toThrow('The endDate is before the current one');
  });
});
