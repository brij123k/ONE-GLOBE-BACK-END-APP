import { IsString } from 'class-validator';

export class SaveMetaTitleDto {
  @IsString()
  productId: string;

  @IsString()
  oldMetaTitle: string;

  @IsString()
  newMetaTitle: string;
}
