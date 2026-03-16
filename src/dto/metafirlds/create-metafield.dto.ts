import { IsString } from "class-validator";

export class CreateMetafieldDto {

  @IsString()
  namespace: string;

  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

}