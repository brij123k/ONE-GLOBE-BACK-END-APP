import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class SpecificationHistory extends Document {

  @Prop({ required: true })
  shopId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  metafieldKey: string;

  @Prop()
  namespace: string;

  @Prop()
  oldValue: string;

  @Prop()
  newValue: string;

  @Prop()
  updatedBy: string;

}

export const SpecificationHistorySchema =
  SchemaFactory.createForClass(SpecificationHistory);