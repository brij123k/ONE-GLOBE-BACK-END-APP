import { IsString } from "class-validator";

export class AnalyzeTagsDto {

  @IsString()
  productId: string;

}