import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, IsUUID } from 'class-validator';
import { Installation } from '../entities/installation.entity';

export enum EVENT_TYPE {
  INSTALLED = 'installed',
  UNINSTALLED = 'uninstalled',
}

export class BaseLifecycleDTO {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  apiVersion: string;

  @ApiProperty()
  @IsString()
  baseUrl: string;

  @ApiProperty()
  @IsString()
  apiBaseUrl: string;

  @ApiProperty()
  @IsString()
  authBaseUrl: string;

  @ApiProperty()
  @IsString()
  openIdConfigurationUrl: string;

  @ApiProperty()
  @IsInt()
  organizationId: number;

  @ApiProperty()
  @IsUUID()
  instanceId: string;

  @ApiProperty()
  @IsEnum(EVENT_TYPE)
  eventType: EVENT_TYPE;
}

export class InstalledInputDTO extends BaseLifecycleDTO {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsString()
  clientSecret: string;

  @ApiProperty()
  @IsString()
  wsBaseUrl: string;

  @ApiProperty()
  @IsString()
  realm: string;

  @ApiProperty()
  @IsString()
  realmValidationRole: string;
}

export const createInstallation = (installationDTO: InstalledInputDTO): Installation => {
  const openIdConfigurationUrl = new URL(installationDTO.openIdConfigurationUrl);

  return {
    apiVersion: installationDTO.apiVersion,
    authBaseUrl: installationDTO.authBaseUrl ?? openIdConfigurationUrl.origin,
    openIdConfigurationUrl: installationDTO.openIdConfigurationUrl,
    wsBaseUrl: installationDTO.wsBaseUrl,
    baseUrl: installationDTO.baseUrl,
    apiBaseUrl: installationDTO.apiBaseUrl,
    clientId: installationDTO.clientId,
    organizationId: String(installationDTO.organizationId),
    instanceId: installationDTO.instanceId,
    clientSecret: installationDTO.clientSecret,
    realm: installationDTO.realm,
    realmValidationRole: installationDTO.realmValidationRole,
  } as Installation;
};

export class UninstalledInputDTO extends BaseLifecycleDTO {}
