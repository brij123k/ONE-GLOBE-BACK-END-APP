import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Shop, ShopSchema } from 'src/schema/shop.schema';
import { ImageAltHistory,ImageAltHistorySchema } from 'src/schema/image/image-alt-history.schema';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { ImageNameHistory,ImageNameHistorySchema } from 'src/schema/image/image-name-history.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageAltHistory.name, schema: ImageAltHistorySchema },
      { name: ImageNameHistory.name, schema: ImageNameHistorySchema },
      { name: Shop.name, schema: ShopSchema },
    ]),
  ],
  controllers: [ImageController],
  providers: [ImageService],
})
export class ImageModule {}