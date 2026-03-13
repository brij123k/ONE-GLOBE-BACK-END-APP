import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopModule } from './api/shop/shop.module';
import { AuthModule } from './api/auth/auth.module';
import { OptimizationModule } from './api/optimization/optimization.module';
import { MetaModule } from './api/meta/meta.module';
// import { ImageSeoModule } from './api/image-seo/image-seo.module';
import { PricingModule } from './api/pricing/pricing.module';
import { SkuModule } from './api/SKU/sku.module';
import { reviertModule } from './api/reviert/reviert.module';
import { VendorModule } from './api/vender/vendor.module';
import { ImageModule } from './api/image/image.module';
import { ProductTypeModule } from './api/product-type/product-type.module';
import { CollectionBuilderModule } from './api/collection-builder/collection-builder.module';
import { TagsBuilderModule } from './api/tag-builder/tags-builder.module';
@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
   MongooseModule.forRoot(process.env.MONGODB_URI as string),

   ShopModule,
   AuthModule,
   OptimizationModule,
   MetaModule,
  //  ImageSeoModule,
   PricingModule,
   SkuModule,
   reviertModule,
   VendorModule,
   ImageModule,
   ProductTypeModule,
   CollectionBuilderModule,
   TagsBuilderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
