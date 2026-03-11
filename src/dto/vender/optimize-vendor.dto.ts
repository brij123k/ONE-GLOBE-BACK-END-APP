import { IsBoolean, IsOptional, IsString } from "class-validator";

export class OptimizeVendorDto {

  @IsString()
  productId: string;

  @IsOptional()
  @IsBoolean()
  apply?: boolean;

}