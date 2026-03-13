import { IsObject, IsString } from "class-validator";

export class UpdateSpecificationDto {

  @IsString()
  productId: string;

  @IsObject()
  specifications: Record<string, any>;

}