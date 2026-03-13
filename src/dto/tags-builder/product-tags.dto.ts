import { IsArray } from "class-validator";

export class ProductTagsDto {

  @IsArray()
  productIds: string[];

}