import { merge } from 'lodash';
import { getPaymentPlans, IPaymentPlanDTO } from './paymentPlan.dto';

export interface IManifestLocalizable {
  value: string; // default text
  i18n?: string; // Localizable text (from translation key in manifest)
}

export enum AppStatus {
  ACTIVE = 'ACTIVE',
  UNDER_EVALUATION = 'UNDER_EVALUATION',
}

export enum AppManifestType {
  APP = 'APP',
  WIDGET = 'WIDGET',
}

export interface IImage {
  url: string; // Image url
  thumbnailUrl?: string; // Image thumbnail url
}

export interface IAuthentication {
  type: 'JWT';
}

export interface IVendor {
  name: string;
  website: string;
  email?: string;
}

export interface ILinks {
  self: string; // Where Corvina polls the manifest.json to check for updates
  changelog?: string; // Changelog shown in the app store details page
}

export interface ILifecycle {
  installed?: string; // Webhook called when the app is installed in an organization
  uninstalled?: string; // Webhook called when the app is uninstalled from an organization
  upgradeOk?: string; // Webhook called when the app is successfully upgraded
  upgradeKo?: string; // Webhook called when the app upgrade fails
  renew?: string; // Webhook called when a payment happens towards the application
}

export interface IDevicePermission {
  deviceGroups: string[];
  generalPermission: string;
  modelPermissions: string[];
}

export interface IScopes {
  applications: string[]; // Application permissions required
  devices?: IDevicePermission[]; // Device permissions required
  userImpersonation?: boolean; // Allow the app service account to impersonate user permissions
}

export interface IGlobalPage {
  id: string;
  title: IManifestLocalizable;
  url: string; // Url rendered inside the iframe container
  iconUrl?: string;
  avoidCorvinaQueryParams?: boolean;
}

export interface INavigationDrawerPage {
  title: IManifestLocalizable;
  url: string; // Url rendered inside the iframe container
  iconUrl: string;
  avoidCorvinaQueryParams?: boolean;
}

export interface IHooks {
  globalPage: IGlobalPage;
  navigationDrawerPages?: INavigationDrawerPage[];
}

export interface IAdditionalRole {
  name: string;
  description: string;
  linkedRoles?: string[];
}

export interface IOidcPublicClient {
  name: string; // max 50 chars
  description?: string; // max 100 chars
  redirectUris: string[];
  webOrigins: string[];
  logoUrl?: string;
  policyUrl?: string;
  tosUrl?: string;
}

export interface IManifestTranslationsDTO {
  urls: Record<string, string>; // locale -> url
}

export interface IManifestDTO {
  key: string;
  name: string;
  description: IManifestLocalizable;
  coverImageUrl: string;
  images?: IImage[];
  iconUrl?: string;
  status?: AppStatus;
  type?: AppManifestType;
  apiVersion: string;
  baseUrl: string;
  trustedOrigins?: string[];
  enableDeviceAccess?: boolean;
  authentication: IAuthentication;
  vendor: IVendor;
  lifecycle?: ILifecycle;
  scopes?: IScopes;
  hooks: IHooks;
  links: ILinks;
  free?: boolean;
  inAppPurchases?: boolean;
  translations?: IManifestTranslationsDTO;
  dependsOn?: string[];
  additionalRoles?: IAdditionalRole[];
  linkedRoles?: string[];
  paymentPlans?: IPaymentPlanDTO[];
  hidden?: boolean;
  oidcPublicClient?: IOidcPublicClient;
  [key: string]: any; // Allow additional properties
}

let manifestJson: IManifestDTO;

export function getManifestJson(): IManifestDTO {
  return manifestJson;
}

export function setManifestJson(manifestBrand: object): void {
  manifestJson = merge(
    {
      key: process.env.MANIFEST_ID,
      name: '[| .Name |]',
      description: {
        value: 'Description of the app',
        i18n: 'manifest.description',
      },
      status: AppStatus.ACTIVE,
      images: [
        {
          url: '/cover.jpeg',
        },
      ],
      coverImageUrl: '/cover.jpeg',
      baseUrl: process.env.MANIFEST_BASE_URL,
      free: true,
      apiVersion: process.env.MANIFEST_API_VERSION.split('-')[1], // chart-1.0.0
      authentication: {
        type: 'JWT',
      },
      vendor: {
        name: 'Corvina',
        website: 'https://corvina.io',
        email: 'support@corvina.io',
      },
      links: {
        self: '/v1/manifest.json',
      },
      lifecycle: {
        installed: '/v1/installed',
        uninstalled: '/v1/uninstalled',
        renew: '/v1/renew',
      },
      hooks: {
        globalPage: {
          id: `${process.env.MANIFEST_ID}-globalPage`,
          title: {
            value: '[| .Name |]',
            i18n: 'manifest.globalPage.title',
          },
          url: `${process.env.MANIFEST_BASE_URL_FE_APP}/#/`,
          iconUrl: '/icon.svg',
        },
      },
      scopes: {
        applications: ['iam.organizations.read'],
      },
      translations: {
        urls: {},
      },
      paymentPlans: getPaymentPlans(),
    },
    manifestBrand
  );
}
