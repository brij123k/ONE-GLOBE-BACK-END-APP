import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProductTypeHistory extends Document {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  oldProductType: string;

  @Prop()
  newProductType: string;

}

export const ProductTypeHistorySchema =
  SchemaFactory.createForClass(ProductTypeHistory);