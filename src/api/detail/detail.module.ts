import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ShopifyModule } from 'src/common/shopify/shopify.module';
import { AiService } from 'src/config/ai.service';
import { Shop, ShopSchema } from 'src/schema/shop.schema';
import {
  DetailHistory,
  DetailHistorySchema,
} from 'src/schema/detail/detail-history.schema';
import {
  DetailOptimization,
  DetailOptimizationSchema,
} from 'src/schema/detail/detail-optimization.schema';
import { DetailController } from './detail.controller';
import { DetailService } from './detail.service';

@Module({
  imports: [
    AuthModule,
    ShopifyModule,
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
      { name: DetailOptimization.name, schema: DetailOptimizationSchema },
      { name: DetailHistory.name, schema: DetailHistorySchema },
    ]),
  ],
  controllers: [DetailController],
  providers: [DetailService, AiService],
})
export class DetailModule {}
