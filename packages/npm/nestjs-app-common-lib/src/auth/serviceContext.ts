import { ICorvinaInstallation } from './installation';

export interface IServiceContext<TInstallation extends ICorvinaInstallation = any> {
  installation: TInstallation;
  currentUser: string;
}
