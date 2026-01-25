import { IsOptional, IsNumberString } from 'class-validator';

export class PaginationDto {
  @IsOptional() @IsNumberString() limit?: string;
  @IsOptional() cursor?: string;
  @IsOptional() collectionId?: string;
}
