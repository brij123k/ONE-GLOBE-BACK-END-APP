import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MetaHandleDocument = MetaHandle & Document;

@Schema({ timestamps: true })
export class MetaHandle {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  oldMetaHandle: string;

  @Prop({ required: true })
  newMetaHandle: string;

  @Prop({ default: false })
  appliedToShopify: boolean;
}

export const MetaHandleSchema =
  SchemaFactory.createForClass(MetaHandle);
