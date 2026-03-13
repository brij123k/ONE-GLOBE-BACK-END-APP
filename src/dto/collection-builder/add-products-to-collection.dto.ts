import { IsArray, IsString } from "class-validator";

export class AddProductsToCollectionDto {

  @IsString()
  collectionId: string;

  @IsString()
  collectionTitle:string;

  @IsString()
  collectionHandle:string;

  @IsArray()
  productIds: string[];

}