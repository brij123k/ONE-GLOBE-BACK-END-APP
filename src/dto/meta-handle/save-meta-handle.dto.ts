import { IsString } from 'class-validator';

export class SaveMetaHandleDto {
  @IsString()
  productId: string;

  @IsString()
  oldMetaHandle: string;

  @IsString()
  newMetaHandle: string;
}
