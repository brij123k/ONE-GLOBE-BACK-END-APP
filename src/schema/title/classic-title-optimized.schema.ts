import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ClassicTitleOptimized extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  oldTitle: string;

  @Prop({ required: true })
  newTitle: string;

  @Prop()
  productImage: string;
}

export const ClassicTitleOptimizedSchema =
  SchemaFactory.createForClass(ClassicTitleOptimized);
