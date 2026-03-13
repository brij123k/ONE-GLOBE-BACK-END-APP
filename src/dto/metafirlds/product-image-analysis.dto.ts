import { IsString } from "class-validator";

export class AnalyzeProductImageDto {

  @IsString()
  imageUrl: string;

}