import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CorvinaJwtServiceMock, INVALID_TOKEN } from '../testing/corvinaJwt.service.mock';
import { CorvinaAuthGuard } from './corvinaAuth.guard';
import { Logger } from '../utils/logger';
import { ICorvinaJwtService, IValidateBearerTokenInput } from './corvinaJwt.service';
import { InstallationNotFoundError } from './installation';

const getMockContext = (authorizationHeader?: string | null, request: any = {}, response: any = { locals: {} }): ExecutionContext =>
  ({
    switchToHttp(): any {
      return {
        getRequest(): any {
          return {
            url: '/v1/instance-id/organization-id/things',
            headers: {
              authorization: authorizationHeader,
            },
            ...request,
          };
        },
        getResponse(): any {
          return response;
        },
      };
    },
  }) as ExecutionContext;

let app: TestingModule;
let guard: CorvinaAuthGuard;
let logger: Logger;
let corvinaJwtService: ICorvinaJwtService;

describe('CorvinaAuthGuard', () => {
  beforeAll(async () => {
    // create nest app instance
    app = await Test.createTestingModule({
      providers: [
        Logger,
        {
          provide: 'ICorvinaJwtService',
          useClass: CorvinaJwtServiceMock,
        },
      ],
    }).compile();
    await app.init();

    logger = app.get<Logger>(Logger);
    corvinaJwtService = app.get<ICorvinaJwtService>('ICorvinaJwtService');

    guard = new CorvinaAuthGuard(corvinaJwtService, logger);

    expect(guard).toBeDefined();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('if the bearer token is not present or string empty we get an UnauthorizedException', async () => {
    const corvinaAuthGuard = guard;

    const wrongAuthorizationHeader = [undefined, null, ''];

    // eslint-disable-next-line no-restricted-syntax
    for (const authorization of wrongAuthorizationHeader) {
      const mockContext = getMockContext(authorization);

      // eslint-disable-next-line no-await-in-loop
      await expect(corvinaAuthGuard.canActivate(mockContext)).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });

  it('an invalid bearer token gives an UnauthorizedException', async () => {
    await expect(guard.canActivate(getMockContext(`Bearer ${INVALID_TOKEN}`))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('a valid bearer token sets the token and the url installation ids in the request and in response.locals', async () => {
    const request: any = {};
    const response: any = { locals: {} };

    await expect(guard.canActivate(getMockContext('Bearer valid', request, response))).resolves.toBe(true);

    expect(response.locals).toMatchObject({ instanceId: 'instance-id', organizationId: 'organization-id' });
    expect(response.locals.corvinaToken.preferred_username).toBe('preferred_username');
  });

  it('a subclass can read the installation ids from elsewhere', async () => {
    class HeadersAuthGuard extends CorvinaAuthGuard {
      // eslint-disable-next-line class-methods-use-this
      protected extractIds(request: any) {
        return { instanceId: request.headers['x-instance-id'], organizationId: request.headers['x-organization-id'] };
      }
    }
    const request = { headers: { authorization: 'Bearer valid', 'x-instance-id': 'i', 'x-organization-id': 'o' } };
    const response: any = { locals: {} };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as ExecutionContext;

    await expect(new HeadersAuthGuard(corvinaJwtService, logger).canActivate(context)).resolves.toBe(true);
    expect(request).toMatchObject({ instanceId: 'i', organizationId: 'o' });
  });

  describe('openid configuration of the body', () => {
    const URL_OF_BODY = 'https://attacker.example/.well-known/openid-configuration';
    let validations: IValidateBearerTokenInput[];
    let installed: boolean;

    const jwtService: ICorvinaJwtService = {
      validateBearerToken: async (input) => {
        validations.push(input);
        if (!input.openIdConfigurationUrl && !installed) throw new InstallationNotFoundError('not installed');
        return { preferred_username: 'core', azp: 'core' } as any;
      },
      getOpenIdConfiguration: async () => ({}) as any,
    };

    const canActivate = (request: any) => {
      const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({ locals: {} }) }) } as ExecutionContext;
      return new CorvinaAuthGuard(jwtService, logger).canActivate(context);
    };

    const lifecycleEvent = (eventType: string, url = `/v1/${eventType}`) => ({
      url,
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { eventType, instanceId: 'i', organizationId: 1, openIdConfigurationUrl: URL_OF_BODY },
    });

    beforeEach(() => {
      validations = [];
      installed = true;
    });

    it('is ignored out of the lifecycle API', async () => {
      await canActivate({ ...lifecycleEvent('installed', '/v1/i/o/things'), body: { openIdConfigurationUrl: URL_OF_BODY } });

      expect(validations).toEqual([{ token: 'token', instanceId: 'i', organizationId: 'o', openIdConfigurationUrl: undefined }]);
    });

    it('is ignored for an existing installation: the token is validated against its realm', async () => {
      await expect(canActivate(lifecycleEvent('installed'))).resolves.toBe(true);

      expect(validations).toEqual([{ token: 'token', instanceId: 'i', organizationId: '1', openIdConfigurationUrl: null }]);
    });

    it('validates the installed event of a new installation', async () => {
      installed = false;
      const request: any = lifecycleEvent('installed');

      await expect(canActivate(request)).resolves.toBe(true);

      expect(validations[1]).toEqual({ token: 'token', openIdConfigurationUrl: URL_OF_BODY });
      expect(request).toMatchObject({ instanceId: 'i', organizationId: '1' });
    });

    it('validates the uninstalled event of a missing installation, that has nothing to remove', async () => {
      installed = false;

      await expect(canActivate(lifecycleEvent('uninstalled'))).resolves.toBe(true);
    });

    it('is ignored for the renew event of a missing installation', async () => {
      installed = false;

      await expect(canActivate(lifecycleEvent('renew'))).rejects.toBeInstanceOf(UnauthorizedException);
      expect(validations).toHaveLength(1);
    });

    it('is ignored when the event type is not the one of the route', async () => {
      installed = false;

      await expect(canActivate({ ...lifecycleEvent('installed'), url: '/v1/renew' })).rejects.toBeInstanceOf(UnauthorizedException);
      expect(validations.every((v) => !v.openIdConfigurationUrl)).toBe(true);
    });
  });

  it('reads the bearer scheme case insensitive', async () => {
    const response: any = { locals: {} };

    await expect(guard.canActivate(getMockContext('bearer valid', {}, response))).resolves.toBe(true);
    await expect(guard.canActivate(getMockContext('BEARER valid', {}, response))).resolves.toBe(true);
  });
});
