import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';
import { Shop, ShopSchema } from 'src/schema/shop.schema';
import { SkuHistory,SkuHistorySchema } from 'src/schema/sku/sku-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkuHistory.name, schema: SkuHistorySchema },
      { name: Shop.name, schema: ShopSchema },
    ]),
  ],
  controllers: [SkuController],
  providers: [SkuService],
})
export class SkuModule {}