import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PricingHistoryDocument = PricingHistory & Document;

@Schema({ timestamps: true })
export class PricingHistory {
  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productTitle: string;

  @Prop([
    {
      variantId: String,
      variantTitle: String,
      costPrice: Number,
      price: Number,
      compareAtPrice: Number,
      profit: Number,
    },
  ])
  variants: {
    variantId: string;
    variantTitle: string;
    costPrice: number;
    price: number;
    compareAtPrice: number;
    profit: number;
  }[];

  @Prop()
  minProfit: number;

  @Prop()
  discount: number;
}

export const PricingHistorySchema =
  SchemaFactory.createForClass(PricingHistory);
