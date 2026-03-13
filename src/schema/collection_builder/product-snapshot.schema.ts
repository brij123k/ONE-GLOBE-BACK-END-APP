import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

class collections {
    @Prop()
    id:string;

    @Prop()
    title:string;

    @Prop()
    handle:string;
}
@Schema({ timestamps: true })
export class ProductSnapshot extends Document {

  @Prop()
  shopId: string;

  @Prop()
  productId: string;

  @Prop()
  title: string;

  @Prop()
  productType: string;

  @Prop()
  vendor: string;

  @Prop()
  tags: string[];

  @Prop()
  image: string;

  @Prop()
  collections:collections[]

}

export const ProductSnapshotSchema =
  SchemaFactory.createForClass(ProductSnapshot);