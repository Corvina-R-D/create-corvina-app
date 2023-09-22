import { Controller, Get } from '@nestjs/common';

@Controller('v1/')
export class ManifestController {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly _MANIFEST_API_VERSION = process.env.MANIFEST_API_VERSION.split('-')[1]; // chart-1.0.0

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly MANIFEST: object = {
    key: process.env.MANIFEST_ID,
    name: '{{ .Name }}',
    description: 'This app enables you to handle a list of repositories. You can upload and download an artifact identified by name and tag version.',
    status: 'ACTIVE',
    images: [
      {
        url: '/static/cover.jpeg',
      },
    ],
    coverImageUrl: '/static/cover.jpeg',
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
      self: '/manifest.json',
    },
    lifecycle: {
      installed: '/installed',
      uninstalled: '/uninstalled',
    },
    hooks: {
      globalPage: {
        id: `${process.env.MANIFEST_ID}-globalPage`,
        title: '{{ .Name }}',
        url: `${process.env.MANIFEST_BASE_URL_FE_APP}/#/`,
        iconUrl: '/static/icon.svg',
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
