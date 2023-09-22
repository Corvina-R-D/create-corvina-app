import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRepositoryDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  version?: string;

  @ApiProperty()
  @IsString()
  type?: string;

  @ApiProperty()
  file: any; // from body content

  @ApiProperty()
  labels?: string;

  @ApiProperty()
  publicAccess?: boolean;

  @ApiProperty()
  repoLabels?: string;
}
