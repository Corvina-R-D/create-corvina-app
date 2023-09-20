import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CorvinaJwtServiceMock } from '../services/corvinaJwt.service.mock';
import { CorvinaAuthGuard } from './corvinaAuth.guard';
import { Logger } from '../utils/logger';
import { ICorvinaJwtService } from '../services/corvinaJwt.service';

const getMockContext = (authorizationHeader?: string): ExecutionContext =>
  ({
    switchToHttp(): any {
      return {
        getRequest(): any {
          return {
            headers: {
              authorization: authorizationHeader,
            },
          };
        },
        getResponse(): any {
          return {
            locals: {},
          };
        },
      };
    },
  } as ExecutionContext);

let app: TestingModule;
let guard: CorvinaAuthGuard;
let logger: Logger;
let corvinaJwtService: ICorvinaJwtService;
let reflector: Reflector;

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
    reflector = app.get<Reflector>(Reflector);

    guard = new CorvinaAuthGuard(corvinaJwtService, logger, reflector);

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

      try {
        corvinaAuthGuard.canActivate(mockContext);
        throw new Error('should not reach this point');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    }
  });
});
