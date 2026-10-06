import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { Installation } from '../entities/installation.entity';
import { toBoolean, toDate } from '../utils/cast.util';

export enum EVENT_TYPE {
  INSTALLED = 'installed',
  UNINSTALLED = 'uninstalled',
  RENEW = 'renew',
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

export class LicensedLifecycleDTO extends BaseLifecycleDTO {
  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  endDate?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  freeTrial?: boolean;
}

export class InstalledInputDTO extends LicensedLifecycleDTO {
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

  @ApiProperty()
  @IsString()
  orgResourceId: string;
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
    orgResourceId: installationDTO.orgResourceId,
    clientSecret: installationDTO.clientSecret,
    realm: installationDTO.realm,
    realmValidationRole: installationDTO.realmValidationRole,
    endDate: installationDTO.endDate,
    planId: installationDTO.planId,
    freeTrial: installationDTO.freeTrial || false,
  } as Installation;
};

export class UninstalledInputDTO extends BaseLifecycleDTO {}

export class RenewInputDTO extends LicensedLifecycleDTO {}
