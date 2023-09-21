import { Installation } from '../entities/installation.entity';

export interface IServiceContext {
  installation: Installation;
  currentUser: string;
}
