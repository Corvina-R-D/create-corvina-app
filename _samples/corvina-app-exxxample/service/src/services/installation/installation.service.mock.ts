/* eslint-disable */
import { Transaction } from 'sequelize';
import { Installation } from '../../entities/installation.entity';
import { IOpenIDConfiguration } from './IOpenIdConfiguration';
import { IInstallInstallationInput, IInstallationDeleteInput, IInstallationDeleteOutput, IInstallationService } from './installation.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InstallationServiceMock implements IInstallationService {
  
  private _installations: Installation[] = [];
  
  getDockerLoginScript({ instanceId, organizationId }: { instanceId: string; organizationId: string }): Promise<string> {
    throw new Error('Method not implemented.');
  }
  
  getArtifactRegistryHost({ instanceId, organizationId }: { instanceId: string; organizationId: string }): Promise<string> {
    throw new Error('Method not implemented.');
  }

  getInstallation({
    instanceId,
    organizationId,
    transaction,
  }: {
    instanceId: string;
    organizationId: string;
    transaction?: Transaction;
  }): Promise<Installation> {
    return Promise.resolve(
      this._installations.find((installation) => installation.instanceId === instanceId && installation.organizationId === organizationId)
    );
  }
  getOpenIdConfiguration(input: string): Promise<IOpenIDConfiguration> {
    return Promise.resolve({
      jwks_uri: 'https://exxxample.test/jwks.json',
      issuer: 'https://exxxample.test',
      authorization_endpoint: 'https://exxxample.test/oauth2/authorize',
    } as unknown as IOpenIDConfiguration);
  }
  create(input: IInstallInstallationInput): Promise<Installation> {
    const installation = {
      ...input,
    } as Installation;

    this._installations.push(installation);

    return Promise.resolve(installation);
  }
  delete(input: IInstallationDeleteInput): Promise<IInstallationDeleteOutput> {
    this._installations = this._installations.filter((installation) => installation.id !== input.instanceId);

    return Promise.resolve({
      success: true,
    });
  }
}
