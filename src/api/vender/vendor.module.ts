import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { Shop, ShopSchema } from 'src/schema/shop.schema';
import { VendorHistory,VendorHistorySchema } from 'src/schema/vendor/vendor-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorHistory.name, schema: VendorHistorySchema },
      { name: Shop.name, schema: ShopSchema },
    ]),
  ],
  controllers: [VendorController],
  providers: [VendorService],
})
export class VendorModule {}