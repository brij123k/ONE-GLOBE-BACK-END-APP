import { IsString } from "class-validator";

export class AnalyzeProductCategoryDto {

  @IsString()
  productId: string;

}