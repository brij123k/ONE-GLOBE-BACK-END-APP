import { Type } from 'class-transformer';
import { IsArray, IsIn, IsISO8601, IsOptional, IsString, ValidateNested } from 'class-validator';

class OptimizationFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];


  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vendors?: string[];

  @IsOptional()
  @IsISO8601()
  createdAfter?: string;

  @IsOptional()
  @IsISO8601()
  publishedAfter?: string;


  @IsOptional()
  @IsISO8601()
  updatedAfter?: string;
}
export class StoreOptimizationDto {
  @IsIn(['title', 'description','metaTitle','metaDescription','handle','image','pricing'])
  serviceName: 'title' | 'description' | 'metaTitle' | 'metaDescription' | 'handle' | 'image' | 'pricing';

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  productIds: string[];
  
  @IsOptional()
  @ValidateNested()
  @Type(() => OptimizationFiltersDto)
  filters?: OptimizationFiltersDto;
}
