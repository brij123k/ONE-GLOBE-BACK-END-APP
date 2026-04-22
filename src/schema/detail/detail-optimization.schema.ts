import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class DetailImage {
  @Prop()
  imageId: string;

  @Prop()
  imageUrl: string;

  @Prop()
  imageName: string;

  @Prop()
  altText: string;
}

@Schema({ timestamps: true })
export class DetailOptimization extends Document {
  @Prop()
  shopId: string;

  @Prop()
  productId: string;

  @Prop()
  productImage: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  descriptionHtml: string;

  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop()
  handle: string;

  @Prop({ type: [Object], default: [] })
  images: DetailImage[];

  @Prop({ default: false })
  optimized: boolean;
}

export const DetailOptimizationSchema =
  SchemaFactory.createForClass(DetailOptimization);
