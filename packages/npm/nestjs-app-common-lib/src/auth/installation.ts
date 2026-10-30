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

/** thrown when the app is not installed in the organization of the request */
export class InstallationNotFoundError extends Error {}

/** events core sends to the lifecycle API */
export enum CORVINA_EVENT_TYPE {
  INSTALLED = 'installed',
  UNINSTALLED = 'uninstalled',
  RENEW = 'renew',
}
