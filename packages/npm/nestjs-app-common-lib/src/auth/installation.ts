import { cacheMethodKey } from '../utils/cache.decorator';

/** DI token of the installation service the app provides */
export const INSTALLATION_SERVICE = 'IInstallationService';

/** installation fields the auth guards read */
export interface ICorvinaInstallation {
  openIdConfigurationUrl: string;
  realmValidationRole?: string;
  orgResourceId?: string;
}

export interface ICorvinaInstallationService<TInstallation extends ICorvinaInstallation = ICorvinaInstallation> {
  /** null when the app is not installed in the organization */
  getInstallation(input: { instanceId: string; organizationId: string }): Promise<TInstallation | null>;
}

/**
 * Cache key of getInstallation({ instanceId, organizationId }): use it as keyBuilder of its @CacheMethod and to invalidate it.
 * organizationId is always a string in the key: an installation read from the db can carry it as a number (a BIGINT column),
 * and a key built from it would miss the one cached by a request.
 */
export const installationCacheKey = (instanceId: string, organizationId: string | number): string =>
  cacheMethodKey('getInstallation', [String(instanceId), String(organizationId)]);

/** thrown when the app is not installed in the organization of the request */
export class InstallationNotFoundError extends Error {}

/** events core sends to the lifecycle API */
export enum CORVINA_EVENT_TYPE {
  INSTALLED = 'installed',
  UNINSTALLED = 'uninstalled',
  RENEW = 'renew',
}
