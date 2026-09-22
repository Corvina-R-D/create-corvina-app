import { merge } from 'lodash';
import { getPaymentPlans, IPaymentPlanDTO } from './paymentPlan.dto';

export interface IImage {
  url: string; // URL of the image
  alt?: string; // Optional alt text for the image
  title?: string; // Optional title for the image
  description?: string; // Optional description for the image
}

export interface IAuthentication {
  type: string; // Type of authentication (e.g., JWT)
}

export interface IVendor {
  name: string; // Name of the vendor
  website: string; // Website URL of the vendor
}

export interface ILinks {
  self: string; // Self link
  [key: string]: string; // Allow additional properties
}

export interface ILifecycle {
  installed: string; // URL for the installed lifecycle event
  uninstalled: string; // URL for the uninstalled lifecycle event
  renew: string; // URL for the renew lifecycle event
}

export interface IScopes {
  applications: string[]; // Array of application scopes
  [key: string]: any; // Allow additional properties
}

export interface IGlobalPage {
  id: string; // ID of the global page
  title: string; // Title of the global page
  url: string; // URL of the global page
  iconUrl: string; // Icon URL for the global page
}

export interface IHooks {
  globalPage: IGlobalPage; // Global page hook
  [key: string]: IGlobalPage; // Allow additional properties
}

export interface IManifestDTO {
  key: string;
  name: string;
  description: string;
  status: string;
  images: IImage[];
  coverImageUrl: string;
  baseUrl: string;
  free: boolean;
  apiVersion: string;
  authentication: IAuthentication;
  vendor: IVendor;
  links: ILinks;
  lifecycle: ILifecycle;
  scopes: IScopes;
  hooks: IHooks;
  paymentPlans: IPaymentPlanDTO[];
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
      description: 'Description of the app',
      status: 'ACTIVE',
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
          title: '[| .Name |]',
          url: `${process.env.MANIFEST_BASE_URL_FE_APP}/#/`,
          iconUrl: '/icon.svg',
        },
      },
      scopes: {
        applications: ['iam.organizations.read'],
      },
      paymentPlans: getPaymentPlans(),
    },
    manifestBrand
  );
}
