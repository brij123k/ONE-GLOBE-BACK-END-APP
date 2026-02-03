import { IsBoolean, IsString } from 'class-validator';

export class AIBulkImageOptimizationDto {
  @IsString()
  productId: string;

  @IsBoolean()
  apply: boolean;
}
