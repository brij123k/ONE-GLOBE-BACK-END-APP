import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OptimizeDetailDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsBoolean()
  image?: boolean;

  @IsOptional()
  @IsBoolean()
  title?: boolean;

  @IsOptional()
  @IsBoolean()
  description?: boolean;

  @IsOptional()
  @IsBoolean()
  apply?: boolean;
}
