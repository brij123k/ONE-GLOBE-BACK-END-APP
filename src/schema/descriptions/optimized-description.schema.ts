import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class OptimizedDescription extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: false })
  productImage: string;

  @Prop({ required: false })
  title: string;

  @Prop({ required: false })
  description: string;
}

export const OptimizedDescriptionSchema =
  SchemaFactory.createForClass(OptimizedDescription);
