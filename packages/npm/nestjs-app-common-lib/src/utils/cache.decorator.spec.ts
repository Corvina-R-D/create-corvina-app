import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { setTimeout } from 'timers/promises';
import { CacheMethod, cacheMethodKey } from './cache.decorator';
import { Logger } from './logger';
import { ICacheService } from './cacheService';

class MapCacheService implements ICacheService {
  private readonly _entries = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this._entries.get(key);
    return entry && entry.expiresAt > Date.now() ? entry.value : undefined;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this._entries.set(key, { value, expiresAt: ttl ? Date.now() + ttl * 1000 : Infinity });
  }

  async del(key: string): Promise<void> {
    this._entries.delete(key);
  }
}

class MyClass {
  // eslint-disable-next-line class-methods-use-this
  @CacheMethod({ ttl: 0.5 })
  async myMethodWithoutParameter() {
    return randomUUID();
  }

  // eslint-disable-next-line class-methods-use-this
  @CacheMethod({ ttl: 0.5 })
  async myMethod(_: { s?: string; n?: number; d?: Date; a?: string[] }) {
    return randomUUID();
  }
}

describe('CacheDecorator', () => {
  let app: TestingModule;
  let myClass: MyClass;
  let cacheService: ICacheService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [MyClass, Logger, { provide: 'ICacheService', useClass: MapCacheService }],
    }).compile();
    await app.init();

    myClass = app.get<MyClass>(MyClass);
    cacheService = app.get<ICacheService>('ICacheService');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('I can cache the result of a method without parameters', async () => {
    const result1 = await myClass.myMethodWithoutParameter();
    const result2 = await myClass.myMethodWithoutParameter();

    expect(result1).toBe(result2);

    await setTimeout(600);

    const resultAfterDelay = await myClass.myMethodWithoutParameter();

    expect(resultAfterDelay).not.toBe(result1);
    expect(resultAfterDelay).not.toBe(result2);
  });

  it('I can cache the result of a method with string, number, date and array parameters', async () => {
    const input = {
      s: 'string',
      n: 1,
      d: new Date(),
      a: ['a', 'b', 'c'],
    };

    const result1 = await myClass.myMethod(input);
    const result2 = await myClass.myMethod(input);

    expect(result1).toBe(result2);

    const result3 = await myClass.myMethod({ ...input, s: 'string2' });

    expect(result3).not.toBe(result2);

    await setTimeout(600);

    const resultAfterDelay = await myClass.myMethod(input);

    expect(resultAfterDelay).not.toBe(result1);
    expect(resultAfterDelay).not.toBe(result2);
    expect(resultAfterDelay).not.toBe(result3);
  });

  it('I can invalidate a cached call deleting its cacheMethodKey', async () => {
    const input = { s: 'invalidate', n: 2 };

    const result1 = await myClass.myMethod(input);

    expect(await cacheService.get(cacheMethodKey('myMethod', [input]))).toBe(result1);

    await cacheService.del(cacheMethodKey('myMethod', [input]));

    expect(await myClass.myMethod(input)).not.toBe(result1);
  });
});
