import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { Shop,ShopSchema } from 'src/schema/shop.schema';
import { PricingHistory, PricingHistorySchema } from 'src/schema/pricing/pricing-history.schema';
import { ShopifyModule } from 'src/common/shopify/shopify.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
      { name: PricingHistory.name, schema: PricingHistorySchema },
    ]),
    ShopifyModule
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
