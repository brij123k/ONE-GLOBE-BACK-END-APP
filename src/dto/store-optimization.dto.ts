import { IsArray, IsIn, IsString } from 'class-validator';

export class StoreOptimizationDto {
  @IsIn(['title', 'description'])
  serviceName: 'title' | 'description';

  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}
