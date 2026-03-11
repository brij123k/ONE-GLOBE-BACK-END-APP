import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OptimizeImageAltDto {

  @IsString()
  productId: string;

  @IsString()
  imageId: string;

  @IsBoolean()
  apply?: boolean;

}