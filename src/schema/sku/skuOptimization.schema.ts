import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SkuOptimization extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop()
  productId?: string;

  @Prop()
  inventoryItemId?: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  variantId: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  handle: string;

  @Prop({ required: true })
  vender: string;

  @Prop({ required: true })
  productType: string;

  @Prop()
  productImage: string;
}

export const SkuOptimizationSchema = SchemaFactory.createForClass(SkuOptimization);