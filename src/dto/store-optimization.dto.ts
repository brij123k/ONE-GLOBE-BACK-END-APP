import { IsArray, IsIn, IsString } from 'class-validator';

export class StoreOptimizationDto {
  @IsIn(['title', 'description','metaTitle','metaDescription','handle','image','pricing'])
  serviceName: 'title' | 'description' | 'metaTitle' | 'metaDescription' | 'handle' | 'image' | 'pricing';

  @IsArray()
  @IsString({ each: true })
  productIds: string[];
  
}
