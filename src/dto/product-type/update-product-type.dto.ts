// import { IsArray, IsString, ValidateNested } from 'class-validator';
// import { Type } from 'class-transformer';

// class ProductTypeItem {

//   @IsString()
//   productId: string;

//   @IsString()
//   oldProductType: string;

//   @IsString()
//   newProductType: string;

// }

// export class UpdateProductTypeDto {

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => ProductTypeItem)
//   updates: ProductTypeItem[];

// }

import { IsString } from "class-validator";

export class UpdateProductTypeDto {

  @IsString()
  productId: string;

  @IsString()
  oldProductType: string;

  @IsString()
  newProductType: string;

}