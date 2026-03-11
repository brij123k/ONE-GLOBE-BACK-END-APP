import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
export class OptimizeImageNameDto {

  @IsString()
  productId: string;

  @IsString()
  imageId: string;

  @IsBoolean()
  apply?: boolean;

}