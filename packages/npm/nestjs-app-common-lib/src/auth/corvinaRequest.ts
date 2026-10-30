import { IncomingHttpHeaders } from 'http';
import { ICorvinaToken } from './corvinaToken';
import { ICorvinaInstallation } from './installation';
import { IServiceContext } from './serviceContext';

/** what the guards set in the request and in response.locals */
export interface ICorvinaAuthResult<TInstallation extends ICorvinaInstallation = ICorvinaInstallation> {
  /** set by CorvinaAuthGuard */
  corvinaToken?: ICorvinaToken;
  /** set by CorvinaAuthGuard */
  instanceId?: string;
  /** set by CorvinaAuthGuard */
  organizationId?: string;
  /** set by CorvinaInstallationRoleGuard */
  context?: IServiceContext<TInstallation>;
}

/** the HTTP request as the guards read it (an express Request is one) */
export interface ICorvinaRequest<TInstallation extends ICorvinaInstallation = ICorvinaInstallation> extends ICorvinaAuthResult<TInstallation> {
  url: string;
  method?: string;
  headers: IncomingHttpHeaders;
  body?: any;
  /** set by a previous middleware, to validate the token without an installation */
  openIdConfigurationUrl?: string;
}

/** the HTTP response as the guards write it (an express Response is one) */
export interface ICorvinaResponse<TInstallation extends ICorvinaInstallation = ICorvinaInstallation> {
  locals?: ICorvinaAuthResult<TInstallation> & Record<string, any>;
}
