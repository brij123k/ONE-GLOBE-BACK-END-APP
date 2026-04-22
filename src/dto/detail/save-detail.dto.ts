import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SaveDetailImageDto {
  @IsString()
  imageId: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  oldAlt?: string;

  @IsOptional()
  @IsString()
  newAlt?: string;

  @IsOptional()
  @IsString()
  oldName?: string;

  @IsOptional()
  @IsString()
  newName?: string;
}

export class SaveDetailDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  oldTitle?: string;

  @IsOptional()
  @IsString()
  newTitle?: string;

  @IsOptional()
  @IsString()
  oldDescription?: string;

  @IsOptional()
  @IsString()
  newDescription?: string;

  @IsOptional()
  @IsString()
  oldMetaTitle?: string;

  @IsOptional()
  @IsString()
  newMetaTitle?: string;

  @IsOptional()
  @IsString()
  oldMetaDescription?: string;

  @IsOptional()
  @IsString()
  newMetaDescription?: string;

  @IsOptional()
  @IsString()
  oldHandle?: string;

  @IsOptional()
  @IsString()
  newHandle?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveDetailImageDto)
  images?: SaveDetailImageDto[];
}
