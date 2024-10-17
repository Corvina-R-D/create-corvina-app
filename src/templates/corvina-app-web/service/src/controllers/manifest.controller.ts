import { Controller, Get } from '@nestjs/common';

@Controller('v1/')
export class ManifestController {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly _MANIFEST_API_VERSION = process.env.MANIFEST_API_VERSION.split('-')[1]; // chart-1.0.0

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly MANIFEST: object = {
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
    apiVersion: this._MANIFEST_API_VERSION,
    authentication: {
      type: 'JWT',
    },
    vendor: {
      name: 'Corvina',
      website: 'http://www.corvina.io',
    },
    links: {
      self: '/v1/manifest.json',
    },
    lifecycle: {
      installed: '/v1/installed',
      uninstalled: '/v1/uninstalled',
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
  };

  @Get('/manifest.json')
  getManifestJson(): object {
    return this.MANIFEST;
  }
}
