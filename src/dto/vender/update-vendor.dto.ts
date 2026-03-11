import { IsArray, IsString } from 'class-validator';

export class UpdateVendorDto {

  @IsString()
  productId: string;

  @IsString()
  oldVendor: string;

  @IsString()
  newVendor: string;

}
