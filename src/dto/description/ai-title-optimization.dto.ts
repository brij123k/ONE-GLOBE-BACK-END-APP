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
  IsObject,
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

    /* ---------------- BRAND CONTAXT ---------------- */
  @IsOptional()
  @IsString()
  brandContext?: string;


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


  @IsOptional()
  @IsObject()
  blockInputs?: Record<string, any>;


  /* ---------------- KEYWORDS ---------------- */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeKeywords?: string[];


  /* ---------------- SOURCES ---------------- */
  @IsOptional()
  @IsBoolean()
  image?: boolean;

  @IsOptional()
  @IsBoolean()
  description?: boolean;


  /* ---------------- APPLY ---------------- */
  @IsOptional()
  @IsBoolean()
  apply?: boolean;
}
