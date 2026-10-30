import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CorvinaJwtServiceMock, INVALID_TOKEN } from '../testing/corvinaJwt.service.mock';
import { CorvinaAuthGuard } from './corvinaAuth.guard';
import { Logger } from '../utils/logger';
import { ICorvinaJwtService } from './corvinaJwt.service';

const getMockContext = (authorizationHeader?: string, request: any = {}, response: any = { locals: {} }): ExecutionContext =>
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
});
