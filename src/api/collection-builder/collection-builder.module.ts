import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductSnapshot, ProductSnapshotSchema } from "src/schema/collection_builder/product-snapshot.schema";
import { Shop, ShopSchema } from "src/schema/shop.schema";
import { CollectionBuilderController } from "./collection-builder.controller";
import { CollectionBuilderService } from "./collection-builder.service";
import { AiService } from "src/config/ai.service";
import { ShopifyModule } from "src/common/shopify/shopify.module";
import { CollectionProduct, CollectionProductSchema } from "src/schema/collection_builder/collection_builder.schema";

@Module({
imports:[
    ShopifyModule,
MongooseModule.forFeature([
{ name:ProductSnapshot.name, schema:ProductSnapshotSchema },
{ name:Shop.name, schema:ShopSchema },
{name: CollectionProduct.name, schema:CollectionProductSchema}

])
],
controllers:[CollectionBuilderController],
providers:[CollectionBuilderService,AiService]
})
export class CollectionBuilderModule{}