import { MongooseModule } from "@nestjs/mongoose";
import { Shop, ShopSchema } from "src/schema/shop.schema";

import { Module } from "@nestjs/common";
import { ReviertService } from "./reviert.service";
import { ClassicTitleOptimized,ClassicTitleOptimizedSchema } from "src/schema/title/classic-title-optimized.schema";
import { reviertController } from "./reviert.controller";
import { ShopifyModule } from "src/common/shopify/shopify.module";
import { ClassicDescriptionOptimized,ClassicDescriptionOptimizedSchema } from "src/schema/descriptions/classic-description-optimized.schema";
import { MetaTitle,MetaTitleSchema } from "src/schema/meta-title/classic-meta-title.schema";
import { MetaDescription,MetaDescriptionSchema } from "src/schema/meta-description/classic-meta-description.schema";
import { MetaHandle,MetaHandleSchema } from "src/schema/meta-handle/classic-meta-handle.schema";
import { SkuHistory,SkuHistorySchema } from "src/schema/sku/sku-history.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClassicTitleOptimized.name, schema: ClassicTitleOptimizedSchema },
      { name: ClassicDescriptionOptimized.name, schema: ClassicDescriptionOptimizedSchema },
      { name: MetaTitle.name, schema: MetaTitleSchema },
      { name: MetaDescription.name, schema: MetaDescriptionSchema },
      { name: MetaHandle.name, schema: MetaHandleSchema },
      { name: SkuHistory.name, schema: SkuHistorySchema },
      { name: Shop.name, schema: ShopSchema },
    ]),
    ShopifyModule
  ],
  controllers: [reviertController],
  providers: [ReviertService],
})
export class reviertModule {}