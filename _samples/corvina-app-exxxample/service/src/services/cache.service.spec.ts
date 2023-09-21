import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '../utils/logger';
import { CacheService, ICacheService } from './cache.service';
import { RedisService } from './redis.service';

let app: TestingModule;
let cacheService: ICacheService;

beforeAll(async () => {
  app = await Test.createTestingModule({
    providers: [CacheService, { provide: 'IRedisService', useClass: RedisService }, Logger],
  }).compile();

  await app.init();
  cacheService = app.get<CacheService>(CacheService);
});

afterAll(async () => {
  await app?.close();
});

it('I can set, get and delete a value from cache', async () => {
  const key = 'test';
  const value = 'test';

  await cacheService.set(key, value);

  expect(await cacheService.get(key)).toBe(value);

  await cacheService.del(key);

  expect(await cacheService.get(key)).toBeUndefined();
});
