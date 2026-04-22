import { IsArray, IsOptional, IsString } from 'class-validator';

export class StoreDetailDto {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  productIds?: string[];
}
