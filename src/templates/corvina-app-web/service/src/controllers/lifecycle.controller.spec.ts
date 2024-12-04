import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { CorvinaJwtServiceMock } from '../services/corvinaJwt.service.mock';
import { Logger } from '../utils/logger';
import { InstallationService } from '../services/installation/installation.service';
import { LifecycleController } from './lifecycle.controller';
import { EVENT_TYPE, InstalledInputDTO, UninstalledInputDTO } from '../dtos/lifecycle.dto';
import { getSequelizeModule } from '../modules/sequelize.module';
import { CacheService } from '../services/cache.service';
import { CustomError } from '../utils/CustomError';
import { RedisService } from '../services/redis.service';

describe('LifecycleController', () => {
  let controller: LifecycleController;
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [LifecycleController],
      imports: [...getSequelizeModule()],
      providers: [
        InstallationService,
        Logger,
        {
          provide: 'ICorvinaJwtService',
          useClass: CorvinaJwtServiceMock,
        },
        { provide: 'IRedisService', useClass: RedisService },
        {
          provide: 'ICacheService',
          useClass: CacheService,
        },
      ],
    }).compile();
    await app.init();

    controller = app.get<LifecycleController>(LifecycleController);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('installation should return "OK" and uninstallation should return "OK"', async () => {
    const installedInput = {
      key: process.env.MANIFEST_ID,
      apiVersion: process.env.MANIFEST_API_VERSION.split('-')[1],
      openIdConfigurationUrl: 'https://auth.corvina.fog:10443/auth/realms/exor/.well-known/openid-configuration',
      baseUrl: 'https://exor.app.corvina.io',
      apiBaseUrl: 'https://www.test.corvina.io',
      authBaseUrl: 'https://www.test.corvina.io',
      wsBaseUrl: 'ws:........',
      clientId: 'clientId-testing',
      clientSecret: 'clientSecret-testing',
      eventType: EVENT_TYPE.INSTALLED,
      organizationId: 2,
      instanceId: randomUUID(),
      realm: 'exor',
      realmValidationRole: 'realmValidationRole-testing',
    } as InstalledInputDTO;

    const installedResponse: string = await controller.installed(installedInput);

    expect(installedResponse).toBe('OK');

    const uninstalledInput = {
      key: process.env.MANIFEST_ID,
      instanceId: installedInput.instanceId,
      eventType: EVENT_TYPE.UNINSTALLED,
      organizationId: installedInput.organizationId,
    } as UninstalledInputDTO;

    const uninstalledResponse: string = await controller.uninstalled(uninstalledInput);

    expect(uninstalledResponse).toBe('OK');
  });

  it('installation fails if I receive an event related to another app', async () => {
    try {
      await controller.installed({
        key: 'ANOTHER APP NOT VALID',
        apiVersion: '1',
        openIdConfigurationUrl: 'https://auth.corvina.fog:10443/auth/realms/exor/.well-known/openid-configuration',
        baseUrl: 'https://exor.app.corvina.io',
        clientId: 'clientId-testing',
        clientSecret: 'clientSecret-testing',
        eventType: EVENT_TYPE.INSTALLED,
        organizationId: 1,
        instanceId: randomUUID(),
        realmValidationRole: 'realmValidationRole-testing',
      } as InstalledInputDTO);
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect(error.code).toBe(505);
      expect(error.message).toBe("I'm corvina-app-[| .Name |] application, I cannot process ANOTHER APP NOT VALID");
    }
  });

  it('installation fails if I receive an invalid event', async () => {
    try {
      await controller.installed({
        key: process.env.MANIFEST_ID,
        apiVersion: '1',
        openIdConfigurationUrl: 'https://auth.corvina.fog:10443/auth/realms/exor/.well-known/openid-configuration',
        baseUrl: 'https://exor.app.corvina.io',
        clientId: 'clientId-testing',
        clientSecret: 'clientSecret-testing',
        eventType: 'THIS EVENT IS NOT VALID' as EVENT_TYPE,
        organizationId: 1,
        instanceId: randomUUID(),
        realmValidationRole: 'realmValidationRole-testing',
      } as InstalledInputDTO);
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect(error.code).toBe(501);
      expect(error.message).toBe("I'm the installation endpoint, I can process only the eventType installed");
    }
  });

  it('uninstallation should return error if I never execute the installation', async () => {
    try {
      await controller.uninstalled({
        key: process.env.MANIFEST_ID,
        apiVersion: '1',
        openIdConfigurationUrl: 'https://auth.corvina.fog:10443/auth/realms/exor/.well-known/openid-configuration',
        baseUrl: 'https://exor.app.corvina.io',
        clientId: 'clientId-testing',
        clientSecret: 'clientSecret-testing',
        eventType: EVENT_TYPE.UNINSTALLED,
        organizationId: -999,
        instanceId: randomUUID(),
        realmValidationRole: 'realmValidationRole-testing',
      } as InstalledInputDTO);
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect(error.code).toBe(506);
      expect(error.message).toBe('Installation not found');
    }
  });
});
