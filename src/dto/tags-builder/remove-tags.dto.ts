import { IsArray } from "class-validator";

export class RemoveTagsDto {

  @IsArray()
  productIds: string[];

  @IsArray()
  tags: string[];

}