import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArtifactDTO {
  @ApiProperty()
  @IsString()
  version: string;

  @ApiProperty()
  file: any; // from body content

  @ApiProperty()
  labels?: string;

  @ApiProperty()
  @IsString()
  type: string;
}

export class SearchArtifactInputDTO {
  @ApiProperty()
  search?: string;

  @ApiProperty()
  pageSize?: number;

  @ApiProperty()
  page?: number;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  types?: string[];

  @ApiProperty()
  labels?: Record<string, string>;

  @ApiProperty()
  repositoryName?: string;

  @ApiProperty()
  isLatest?: boolean;

  @ApiProperty()
  resourceUrl?: string;

  @ApiProperty()
  immutableResourceUrl?: string;
}

export class UpdateArtifactDTO {
  @ApiProperty()
  versions?: string[];

  @ApiProperty()
  labels?: Record<string, string>;
}
