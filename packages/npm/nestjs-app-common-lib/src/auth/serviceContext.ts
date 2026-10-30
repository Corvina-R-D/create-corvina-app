import { ICorvinaInstallation } from './installation';

/** context of a request, set by CorvinaInstallationRoleGuard */
export interface IServiceContext<TInstallation extends ICorvinaInstallation = ICorvinaInstallation> {
  installation: TInstallation;
  /** preferred_username of the token, without the service account prefix */
  currentUser: string;
}
