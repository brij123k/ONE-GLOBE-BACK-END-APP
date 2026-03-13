import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Specification {
    @Prop({ required: true })
    shopId: string

    @Prop({ required: true })
    productId: string;

    @Prop({ required: true })
    title: string;

    @Prop()
    productImage: string;

@Prop({ type: Object })
  specifications: Record<string, any>;


    @Prop({ default: false })
    optimized: boolean
}
export const SpecificationSchema =
  SchemaFactory.createForClass(Specification);