/** access token of a Corvina realm (Keycloak), as validated by ICorvinaJwtService */
export interface ICorvinaToken {
  iss: string;
  aud: string | string[];
  sub: string;
  azp: string;
  realm_access: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  scope?: string;
  exp: number;
  iat: number;
  jti: string;
  typ: string;
  email?: string;
  email_verified: boolean;
  preferred_username: string;
}
