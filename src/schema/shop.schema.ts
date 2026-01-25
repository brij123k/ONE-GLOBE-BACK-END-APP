import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShopDocument = Shop & Document;

@Schema({ timestamps: true })
export class Shop {

  @Prop({ required: true, unique: true })
  shopDomain: string; // example: test-store.myshopify.com

  @Prop({ required: true })
  accessToken: string;

  @Prop({ required: true })
  shopName: string;

  @Prop()
  email: string;

  @Prop()
  owner: string;

  @Prop()
  plan: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  country: string;

  @Prop()
  currency: string;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);
