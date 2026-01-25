import { IsString } from 'class-validator';

export class ApplyDescriptionOptimizationDto {
  @IsString()
  productId: string;

  @IsString()
  oldDescription: string;

  @IsString()
  newDescription: string;
}
