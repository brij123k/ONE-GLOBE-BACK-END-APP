import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Vendor {
    @Prop({ required: true })
    shopId: string

    @Prop({ required: true })
    productId: string;

    @Prop({default:"Vendor not found"})
    vendor: string;

    @Prop({ required: true })
    title: string;

    @Prop()
    productImage: string;

    @Prop({ default: false })
    optimized: boolean
}
export const VendorSchema =
  SchemaFactory.createForClass(Vendor);