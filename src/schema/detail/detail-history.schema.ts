import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DetailHistory extends Document {
  @Prop()
  shopId: string;

  @Prop()
  productId: string;

  @Prop({ type: Object })
  oldValues: Record<string, any>;

  @Prop({ type: Object })
  newValues: Record<string, any>;

  @Prop({ default: true })
  appliedToShopify: boolean;
}

export const DetailHistorySchema =
  SchemaFactory.createForClass(DetailHistory);
