import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class VendorHistory extends Document {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  oldVendor: string;

  @Prop({ required: true })
  newVendor: string;

}

export const VendorHistorySchema = SchemaFactory.createForClass(VendorHistory);