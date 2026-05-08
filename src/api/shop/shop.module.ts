import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { Shop,ShopSchema } from 'src/schema/shop.schema';
import { AiService } from 'src/config/ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
    ]),
  ],
  controllers: [ShopController],
  providers: [ShopService, AiService],
  exports: [ShopService],
})
export class ShopModule {}
