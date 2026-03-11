import { IsArray } from "class-validator";

export class AIProductTypeSuggestionDto {

  @IsArray()
  productTypes: string[];

}