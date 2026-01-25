import { IsOptional, IsString } from 'class-validator';

export class ProductFilterDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() vendor?: string;
  @IsOptional() @IsString() productType?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() createdAfter?: string;
  @IsOptional() @IsString() publishedAfter?: string;
  @IsOptional() @IsString() updatedAfter?: string;
}
