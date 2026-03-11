import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ImageAltItem {

  @IsString()
  productId: string;

  @IsString()
  imageId: string;

  @IsString()
  oldAlt: string;

  @IsString()
  newAlt: string;

}

export class UpdateImageAltDto {

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageAltItem)
  updates: ImageAltItem[];

}