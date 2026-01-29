import { IsArray, IsIn, IsString } from 'class-validator';

export class StoreOptimizationDto {
  @IsIn(['title', 'description','metaTitle','metaDescription'])
  serviceName: 'title' | 'description' | 'metaTitle' | 'metaDescription';

  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}
