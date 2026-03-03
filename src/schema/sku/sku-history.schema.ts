import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SkuHistory extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop()
  productId?: string;

  @Prop({ required: true })
  variantId: string;

  @Prop({ required: true })
  oldSku: string;

  @Prop({ required: true })
  newSku: string;
}

export const SkuHistorySchema = SchemaFactory.createForClass(SkuHistory);