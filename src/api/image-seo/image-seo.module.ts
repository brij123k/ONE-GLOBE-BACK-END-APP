import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ImageOptimized, ImageOptimizedSchema } from "src/schema/image/image-optimized.schema";
import { ImageSeoController } from "./image-seo.controller";
import { ImageSeoService } from "./image-seo.service";
import { ShopifyModule } from "src/common/shopify/shopify.module";
import { AiService } from "src/config/ai.service";
import { Shop, ShopSchema } from "src/schema/shop.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageOptimized.name, schema: ImageOptimizedSchema },
      { name: Shop.name, schema: ShopSchema },
    ]),
    ShopifyModule,
  ],
  controllers: [ImageSeoController],
  providers: [ImageSeoService,AiService],
})
export class ImageSeoModule {}
