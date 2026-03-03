import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SkuUpdateItem {
  @IsString()
  variantId: string;

  @IsString()
  oldSku: string;

  @IsString()
  newSku: string;
}

export class UpdateSkuDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuUpdateItem)
  updates: SkuUpdateItem[];
}