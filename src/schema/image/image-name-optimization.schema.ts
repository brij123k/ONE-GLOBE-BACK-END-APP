import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ImageNameOptimization extends Document {

  @Prop()
  shopId: string;

  @Prop()
  productId: string;

  @Prop()
  productTitle: string;

  @Prop()
  imageId: string;
  
  @Prop()
  imageUrl: string;

  @Prop()
  imageName: string;

}

export const ImageNameOptimizationSchema =
  SchemaFactory.createForClass(ImageNameOptimization);