import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AIDescriptionOptimizationDto {

  /* ---------------- PRODUCT ---------------- */
  @IsString()
  productId: string;


  /* ---------------- FORMAT ---------------- */
  @IsString()
  formatId: string;

  @IsString()
  formatName: string;


  /* ---------------- TONE ---------------- */
  @IsOptional()
  @IsString()
  tone?: string;


  /* ---------------- LENGTH ---------------- */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(2000)
  targetLength?: number;


  /* ---------------- BLOCKS ---------------- */
  @IsArray()
  @ArrayNotEmpty()
  blocks: string[];


  /* ---------------- KEYWORDS ---------------- */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeKeywords?: string[];


  /* ---------------- APPLY ---------------- */
  @IsOptional()
  @IsBoolean()
  apply?: boolean;
}
