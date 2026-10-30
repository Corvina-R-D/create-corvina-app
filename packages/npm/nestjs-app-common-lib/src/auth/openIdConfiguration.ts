// https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
export interface IOpenIDConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  introspection_endpoint?: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
  jwks_uri: string;
  [key: string]: unknown;
}
