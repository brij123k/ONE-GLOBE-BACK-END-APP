import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TagsBuilderController } from "./tags-builder.controller";
import { TagsBuilderService } from "./tags-builder.service";
import { ShopifyModule } from "src/common/shopify/shopify.module";
import { AiService } from "src/config/ai.service";
import { Shop, ShopSchema } from "src/schema/shop.schema";
import { TagsProduct,TagsProductSchema } from "src/schema/tags-builder/tag_builder.schema";

@Module({
imports:[

ShopifyModule,

MongooseModule.forFeature([
{ name: TagsProduct.name, schema: TagsProductSchema },
{ name: Shop.name, schema: ShopSchema }
])

],
controllers:[TagsBuilderController],
providers:[TagsBuilderService,AiService]
})
export class TagsBuilderModule{}