import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class ProductType {
    @Prop({ required: true })
    shopId: string

    @Prop({ required: true })
    productId: string;

    @Prop({default:"Product Type not found"})
    productType: string;

    @Prop({ required: true })
    title: string;

    @Prop()
    productImage: string;

    @Prop({ default: false })
    optimized: boolean
}
export const ProductTypeSchema =
  SchemaFactory.createForClass(ProductType);