import { IsString } from 'class-validator';

export class ApplyTitleOptimizationDto {
  @IsString()
  productId: string;

  @IsString()
  oldTitle?: string;

  @IsString()
  newTitle?: string;
}
