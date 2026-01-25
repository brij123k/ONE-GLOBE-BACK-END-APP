import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ClassicDescriptionOptimized extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  oldDescription: string;

  @Prop({ required: true })
  newDescription: string;

  @Prop()
  productImage: string;
}

export const ClassicDescriptionOptimizedSchema =
  SchemaFactory.createForClass(ClassicDescriptionOptimized);
