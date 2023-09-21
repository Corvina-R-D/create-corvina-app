import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from './healthcheck.controller';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
    }).compile();

    controller = app.get<HealthCheckController>(HealthCheckController);
  });

  it('should return "OK"', () => {
    expect(controller.ping()).toBe('OK');
  });
});
