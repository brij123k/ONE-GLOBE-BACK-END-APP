import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class VariantRef {
  @Prop({ required: true })
  variantId: string;

  @Prop()
  title: string;

  @Prop()
  sku: string;
}

@Schema({ _id: false })
export class ProductImageSnapshot {
  @Prop({ required: true })
  imageRestId: string; // REST image id (number as string)

  @Prop({ required: true })
  imageGraphqlId: string; // admin_graphql_api_id (MediaImage)

  @Prop()
  imageUrl: string;

  @Prop()
  imageName: string;

  @Prop()
  altText: string;

  @Prop({ type: [VariantRef], default: [] })
  variants: VariantRef[];
}

@Schema({ timestamps: true })
export class ImageOptimization extends Document {
  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  productTitle: string;

  @Prop({ type: [ProductImageSnapshot], default: [] })
  images: ProductImageSnapshot[];
}

export const ImageOptimizationSchema =
  SchemaFactory.createForClass(ImageOptimization);
