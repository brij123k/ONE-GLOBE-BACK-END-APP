import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ImageAltHistory extends Document {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  imageId: string;

  @Prop()
  oldAlt: string;

  @Prop()
  newAlt: string;

}

export const ImageAltHistorySchema =
  SchemaFactory.createForClass(ImageAltHistory);