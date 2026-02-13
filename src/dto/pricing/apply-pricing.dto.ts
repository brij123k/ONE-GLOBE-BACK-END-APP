import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ApplyPricingDto {
  @IsString()
  productId: string;

  @IsNumber()
  minProfit: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsArray()
  variants: {
    variantId: string;
    price: number;
    compareAtPrice?: number | null;
  }[];
}
