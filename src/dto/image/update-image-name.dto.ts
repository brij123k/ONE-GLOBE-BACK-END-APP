import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImageNameItem {

  @IsString()
  productId: string;

  @IsString()
  imageId: string;

  @IsString()
  imageUrl: string;

  @IsString()
  oldName: string;

  @IsString()
  newName: string;

}

export class UpdateImageNameDto {

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageNameItem)
  updates: ImageNameItem[];

}