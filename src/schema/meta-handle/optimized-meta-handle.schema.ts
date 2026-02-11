import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OptimizedMetaHandleDocument = OptimizedMetaHandle & Document;

@Schema({ timestamps: true })
export class OptimizedMetaHandle {

  @Prop({ type: Types.ObjectId, required: true, index: true })
  shopId: Types.ObjectId;

  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  metaHandle: string;

  @Prop()
  productImage: string;
}

export const OptimizedMetaHandleSchema =
  SchemaFactory.createForClass(OptimizedMetaHandle);
