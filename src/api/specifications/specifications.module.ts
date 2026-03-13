import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Shop, ShopSchema } from 'src/schema/shop.schema';
import { VendorHistory,VendorHistorySchema } from 'src/schema/vendor/vendor-history.schema';
import { ShopifyModule } from 'src/common/shopify/shopify.module';
import { AiService } from 'src/config/ai.service';
import { SpecificationService } from './specifications.service';
import { SpecificationController } from './specifications.controller';
import { SpecificationHistory, SpecificationHistorySchema } from 'src/schema/metafileds/specification-history.schema';
SpecificationHistory
@Module({
  imports: [
    ShopifyModule,
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
      { name: SpecificationHistory.name, schema: SpecificationHistorySchema },
    ]),
  ],
  controllers: [SpecificationController],
  providers: [SpecificationService,AiService],
})
export class SpeficiationModule {}