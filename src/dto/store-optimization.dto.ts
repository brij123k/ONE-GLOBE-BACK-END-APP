import { IsArray, IsIn, IsString } from 'class-validator';

export class StoreOptimizationDto {
  @IsIn(['title', 'description','metaTitle','metaDescription','handle','image'])
  serviceName: 'title' | 'description' | 'metaTitle' | 'metaDescription' | 'handle' | 'image';

  @IsArray()
  @IsString({ each: true })
  productIds: string[];
  
}
