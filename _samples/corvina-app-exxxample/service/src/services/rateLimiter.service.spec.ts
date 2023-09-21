import { Test, TestingModule } from '@nestjs/testing';
import { setTimeout } from 'timers/promises';
import { RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { IRateLimiterService, RateLimiterService, getRateLimiterKey } from './rateLimiter.service';
import { RedisService } from './redis.service';

let app: TestingModule;
let service: IRateLimiterService;
let redisClient: RedisClientType;

beforeAll(async () => {
  app = await Test.createTestingModule({
    providers: [RateLimiterService, { provide: 'IRedisService', useClass: RedisService }, Logger],
  }).compile();

  await app.init();
  service = app.get<RateLimiterService>(RateLimiterService);

  redisClient = await app.get<RedisService>('IRedisService').getClient();
});

afterAll(async () => {
  await app?.close();
});

const waitTillNextSecond = async () => {
  // get current milliseconds
  const now = Date.now();
  // wait till next second
  await setTimeout(1000 - (now % 1000));
};

it('I cannot execute more than 10 requests per second', async () => {
  await waitTillNextSecond();

  for (let i = 0; i < 10; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const { count, canDo } = await service.incr('test', { max: 10 });
    expect(canDo).toBe(true);
    expect(count).toBe(i + 1);
  }

  expect(await redisClient.exists(getRateLimiterKey('test'))).toBe(1);

  let { count, canDo } = await service.incr('test', { max: 10 });
  expect(canDo).toBe(false);
  expect(count).toBe(11);

  await setTimeout(1000);

  ({ count, canDo } = await service.incr('test', { max: 10 }));
  expect(canDo).toBe(true);
  expect(count).toBe(1);

  await setTimeout(1000);

  expect(await redisClient.exists(getRateLimiterKey('test'))).toBe(0);
});
