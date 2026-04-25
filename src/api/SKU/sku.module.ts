import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';
import { Shop, ShopSchema } from 'src/schema/shop.schema';
import { SkuHistory,SkuHistorySchema } from 'src/schema/sku/sku-history.schema';
import { SkuOptimization, SkuOptimizationSchema } from 'src/schema/sku/skuOptimization.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkuHistory.name, schema: SkuHistorySchema },
      { name: Shop.name, schema: ShopSchema },
      { name: SkuOptimization.name, schema: SkuOptimizationSchema },
    ]),
  ],
  controllers: [SkuController],
  providers: [SkuService],
})
export class SkuModule {}