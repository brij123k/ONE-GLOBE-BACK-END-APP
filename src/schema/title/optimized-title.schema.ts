import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class OptimizedTitle extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  productImage: string;

  @Prop({ required: true })
  title: string;
}

export const OptimizedTitleSchema =
  SchemaFactory.createForClass(OptimizedTitle);
