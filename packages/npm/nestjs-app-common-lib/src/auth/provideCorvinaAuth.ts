import { Provider } from '@nestjs/common';
import { CORVINA_JWT_SERVICE, CorvinaJwtService } from './corvinaJwt.service';

/**
 * Providers of the auth guards, for the module of the guarded controllers.
 * That module also provides Logger, the ICacheService ('ICacheService') and the installation service ('IInstallationService').
 */
export const provideCorvinaAuth = (): Provider[] => [{ provide: CORVINA_JWT_SERVICE, useClass: CorvinaJwtService }];
