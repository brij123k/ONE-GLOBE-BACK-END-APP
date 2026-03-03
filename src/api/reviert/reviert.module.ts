import { MongooseModule } from "@nestjs/mongoose";
import { Shop, ShopSchema } from "src/schema/shop.schema";

import { Module } from "@nestjs/common";
import { ReviertService } from "./reviert.service";
import { ClassicTitleOptimized,ClassicTitleOptimizedSchema } from "src/schema/title/classic-title-optimized.schema";
import { reviertController } from "./reviert.controller";
import { ShopifyModule } from "src/common/shopify/shopify.module";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClassicTitleOptimized.name, schema: ClassicTitleOptimizedSchema },
      { name: Shop.name, schema: ShopSchema },
    ]),
    ShopifyModule
  ],
  controllers: [reviertController],
  providers: [ReviertService],
})
export class reviertModule {}