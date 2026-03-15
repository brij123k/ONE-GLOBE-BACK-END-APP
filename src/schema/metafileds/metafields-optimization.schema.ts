import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class MetafieldsOptimization extends Document {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  title: string;

  @Prop()
  productType: string;

  @Prop()
  vendor: string;

  @Prop()
  productImage: string;

  @Prop({ default: false })
  optimized: boolean;

  @Prop({ type: Object, default: null })
  metafields: any;
}

export const MetafieldsOptimizationSchema =
  SchemaFactory.createForClass(MetafieldsOptimization);