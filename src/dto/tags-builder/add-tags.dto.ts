import { IsArray, IsString } from "class-validator";

export class AddTagsDto {

  @IsArray()
  productIds: string[];

  @IsArray()
  tags: string[];

}