import { ApiProperty } from '@nestjs/swagger';

export class PaginatedDto<TData> {
  @ApiProperty()
  content: TData[];

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  totalElements: number;

  @ApiProperty()
  last: boolean;

  @ApiProperty()
  number: number;

  @ApiProperty()
  size: number;
}
