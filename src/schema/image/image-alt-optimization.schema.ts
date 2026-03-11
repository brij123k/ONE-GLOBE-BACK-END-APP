import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ImageAltOptimization extends Document {

  @Prop()
  shopId: string;

  @Prop()
  productId: string;

  @Prop()
  productTitle: string;

  @Prop()
  variantId: string;

  @Prop()
  variantTitle: string;

  @Prop()
  inventoryItemId: string;

  @Prop()
  imageId: string;

  @Prop()
  imageUrl: string;

  @Prop()
  imageName: string;

  @Prop()
  altText: string;

}

export const ImageAltOptimizationSchema =
  SchemaFactory.createForClass(ImageAltOptimization);