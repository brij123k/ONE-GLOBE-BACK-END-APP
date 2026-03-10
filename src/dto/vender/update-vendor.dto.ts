import { IsArray, IsString } from 'class-validator';

export class UpdateVendorItem {

  @IsString()
  productId: string;

  @IsString()
  oldVendor: string;

  @IsString()
  newVendor: string;

}

export class UpdateVendorDto {

  @IsArray()
  updates: UpdateVendorItem[];

}