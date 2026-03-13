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
export class CollectionProduct extends Document {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  title: string;

  @Prop()
  vendor: string;

  @Prop()
  productType: string;

  @Prop([String])
  tags: string[];

  @Prop()
  productImage: string;

   @Prop()
   collections:collections[]


}

export const CollectionProductSchema =
  SchemaFactory.createForClass(CollectionProduct);