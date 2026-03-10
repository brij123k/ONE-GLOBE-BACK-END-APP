import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ImageNameHistory extends Document {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  imageId: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  oldName: string;

  @Prop()
  newName: string;

  @Prop()
  oldExtension: string;

}

export const ImageNameHistorySchema =
  SchemaFactory.createForClass(ImageNameHistory);