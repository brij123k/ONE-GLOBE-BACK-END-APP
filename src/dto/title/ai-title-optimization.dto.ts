import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AITitleOptimizationDto {
  @IsString()
  productId: string;

  @IsString()
  categoryName: string;

  @IsNumber()
  minCharacters: number;

  @IsNumber()
  maxCharacters: number;

  @IsOptional()
  @IsString()
  primaryElement?: string;

  @IsOptional()
  @IsString()
  secondaryElement?: string;

  @IsOptional()
  @IsString()
  mustIncludeKeywords?: string;

  @IsOptional()
  @IsString()
  excludeKeywords?: string;

  @IsOptional()
  @IsString()
  tone?: string;

   @IsOptional()
  @IsBoolean()
  apply?: boolean;
}
