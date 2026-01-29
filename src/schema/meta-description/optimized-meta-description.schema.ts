import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OptimizedMetaDescriptionDocument = OptimizedMetaDescription & Document;

@Schema({ timestamps: true })
export class OptimizedMetaDescription {

  @Prop({ type: Types.ObjectId, required: true, index: true })
  shopId: Types.ObjectId;

  @Prop({ required: true, index: true })
  productId: string; // Shopify GID

  @Prop({ required: true })
  description: string;

  @Prop()
  metaDescription: string;

  @Prop()
  productImage: string;
}

export const OptimizedMetaDescriptionSchema =
  SchemaFactory.createForClass(OptimizedMetaDescription);
