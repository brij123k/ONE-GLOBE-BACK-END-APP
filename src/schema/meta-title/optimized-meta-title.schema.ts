import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OptimizedMetaTitleDocument = OptimizedMetaTitle & Document;

@Schema({ timestamps: true })
export class OptimizedMetaTitle {

  @Prop({ type: Types.ObjectId, required: true, index: true })
  shopId: Types.ObjectId;

  @Prop({ required: true, index: true })
  productId: string; // Shopify GID

  @Prop({ required: true })
  title: string;

  @Prop()
  metaTitle: string;

  @Prop()
  productImage: string;
}

export const OptimizedMetaTitleSchema =
  SchemaFactory.createForClass(OptimizedMetaTitle);
