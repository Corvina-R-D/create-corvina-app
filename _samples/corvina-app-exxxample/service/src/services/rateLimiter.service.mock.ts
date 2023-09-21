/* eslint-disable */
import { IRateLimiterServiceOptions, IRateLimiterService } from './rateLimiter.service';

export const CANNOT_DO_IDENTIFIER = 'test-cannot-do';

export class RateLimiterServiceMock implements IRateLimiterService {
  incr(identifier: string, options: IRateLimiterServiceOptions): Promise<{ count: number; canDo: boolean }> {
    if (identifier === CANNOT_DO_IDENTIFIER) {
      return Promise.resolve({ count: 1, canDo: false });
    }
    return Promise.resolve({ count: 0, canDo: true });
  }
}
