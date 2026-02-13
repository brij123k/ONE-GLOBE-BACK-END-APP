import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CalculatePricingDto {
  @IsString()
  productId: string;

  @IsNumber()
  minProfit: number;

  @IsOptional()
  @IsNumber()
  discount?: number;
}
