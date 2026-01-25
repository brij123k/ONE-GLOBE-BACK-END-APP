import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class OptimizedDescription extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  productImage: string;

  @Prop({ required: true })
  description: string;
}

export const OptimizedDescriptionSchema =
  SchemaFactory.createForClass(OptimizedDescription);
