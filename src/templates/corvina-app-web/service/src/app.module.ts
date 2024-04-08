import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { getSequelizeModule } from './modules/sequelize.module';
import { CorvinaJwtService } from './services/corvinaJwt.service';
import { InstallationService } from './services/installation/installation.service';
import { Logger } from './utils/logger';
import { HealthCheckController } from './controllers/healthcheck.controller';
import { LifecycleController } from './controllers/lifecycle.controller';
import { ManifestController } from './controllers/manifest.controller';
import { CacheService } from './services/cache.service';
import { RedisService } from './services/redis.service';
import { RateLimiterService } from './services/rateLimiter.service';
import { AuthorizationController } from './controllers/authorization.controller';
import { InMemoryCacheService } from './services/inMemoryCache.service';

@Module({
  imports: [
    ...getSequelizeModule(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static-assets'),
      serveRoot: '/',
    }),
  ],
  controllers: [HealthCheckController, LifecycleController, AuthorizationController, ManifestController],
  providers: [
    Logger,
    InstallationService,
    {
      provide: 'IInstallationService',
      useExisting: InstallationService,
    },
    {
      provide: 'ICacheService',
[|- if .RedisEnabled |]
      useClass: CacheService,
[|- else |]
      useClass: InMemoryCacheService,
[|- end |]
    },
    {
      provide: 'ICorvinaJwtService',
      useClass: CorvinaJwtService,
    },
[|- if .RedisEnabled |]
    {
      provide: 'IRedisService',
      useClass: RedisService,
    },
    {
      provide: 'IRateLimiterService',
      useClass: RateLimiterService,
    },
[|- end |]
  ],
})
export class AppModule {}
