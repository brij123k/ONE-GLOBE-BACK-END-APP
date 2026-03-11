import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductTypeController } from './product-type.controller';
import { ProductTypeService } from './product-type.service';

import { Shop, ShopSchema } from 'src/schema/shop.schema';
import {
  ProductTypeHistory,
  ProductTypeHistorySchema,
} from 'src/schema/product-type/product-type-history.schema';
import { AiService } from 'src/config/ai.service';
import { ShopifyModule } from 'src/common/shopify/shopify.module';

@Module({
  imports: [
    ShopifyModule,
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
      { name: ProductTypeHistory.name, schema: ProductTypeHistorySchema },
    ]),
  ],
  controllers: [ProductTypeController],
  providers: [ProductTypeService,AiService],
  exports: [ProductTypeService],
})
export class ProductTypeModule {}