import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ApplyPricingDto {
  @IsString()
  productId: string;

  @IsNumber()
  minProfit: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  @IsOptional()
  @IsNumber()
  newPrice?: number;

  @IsArray()
  variants: {
    variantId: string;
    price: number;
    compareAtPrice?: number | null;
  }[];
}
