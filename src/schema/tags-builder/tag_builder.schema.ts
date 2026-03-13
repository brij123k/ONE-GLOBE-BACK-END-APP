import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class TagsProduct extends Document {

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

}

export const TagsProductSchema =
  SchemaFactory.createForClass(TagsProduct);