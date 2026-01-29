import { IsString } from 'class-validator';

export class SaveMetaDescriptionDto {
  @IsString()
  productId: string;

  @IsString()
  oldMetaDescription: string;

  @IsString()
  newMetaDescription: string;
}
