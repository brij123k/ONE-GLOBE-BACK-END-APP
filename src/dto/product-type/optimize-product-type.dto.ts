import { IsBoolean, IsOptional, IsString } from "class-validator";

export class OptimizeProductTypeDto {

  @IsString()
  productId: string;

  @IsOptional()
  @IsBoolean()
  apply?: boolean;

}