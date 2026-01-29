import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MetaTitleDocument = MetaTitle & Document;

@Schema({ timestamps: true })
export class MetaTitle {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  oldMetaTitle: string;

  @Prop({ required: true })
  newMetaTitle: string;

  @Prop({ default: false })
  appliedToShopify: boolean;
}

export const MetaTitleSchema =
  SchemaFactory.createForClass(MetaTitle);
