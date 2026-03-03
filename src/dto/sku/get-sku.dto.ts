import { IsArray, IsString } from 'class-validator';

export class GetSkuDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}