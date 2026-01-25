import { IsString, IsOptional } from 'class-validator';

export class CreateShopDto {
  @IsString()
  shopDomain: string;

  @IsString()
  accessToken: string;

  @IsString()
  shopName: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  owner?: string;

  @IsOptional()
  plan?: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  currency?: string;
}
