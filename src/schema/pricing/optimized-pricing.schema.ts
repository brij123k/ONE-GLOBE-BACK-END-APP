import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OptimizedPricingDocument = OptimizedPricing & Document;

@Schema({ timestamps: true })
export class OptimizedPricing {

  @Prop({ type: Types.ObjectId, required: true, index: true })
  shopId: Types.ObjectId;

  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true })
  title: string;

   @Prop([
    {
      variantId: String,
      title: String,
      sku: String,
      image: String,

      price: Number,
      compareAtPrice: Number,
      costPrice: Number,

      inventoryQuantity: Number,
    },
  ])
  variants: {
    variantId: string;
    title: string;
    sku: string;
    image: string;

    price: number;
    compareAtPrice: number;
    costPrice: number;

    inventoryQuantity: number;
  }[];

  @Prop()
  productImage: string;
}

export const OptimizedPricingSchema =
  SchemaFactory.createForClass(OptimizedPricing);
