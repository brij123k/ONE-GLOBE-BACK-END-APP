import { IsString } from "class-validator";

export class AddProductMetafieldDto {

  @IsString()
  productId: string;

  @IsString()
  namespace: string;

  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsString()
  type: string;

}