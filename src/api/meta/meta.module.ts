import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';

import {
  OptimizedTitle,
  OptimizedTitleSchema,
} from 'src/schema/title/optimized-title.schema';

import {
  OptimizedDescription,
  OptimizedDescriptionSchema,
} from 'src/schema/descriptions/optimized-description.schema';
import { Shop, ShopSchema } from 'src/schema/shop.schema';
import { AuthModule } from '../auth/auth.module';
import { ShopifyModule } from 'src/common/shopify/shopify.module';
import { AiService } from 'src/config/ai.service';
import { MetaTitle,MetaTitleSchema } from 'src/schema/meta-title/classic-meta-title.schema';
import { MetaDescription,MetaDescriptionSchema } from 'src/schema/meta-description/classic-meta-description.schema';
@Module({
  imports: [
    AuthModule,
    ShopifyModule,
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
    ]),
    MongooseModule.forFeature([
      { name: MetaTitle.name, schema: MetaTitleSchema },
      { name: MetaDescription.name, schema: MetaDescriptionSchema },
    ]),
  ],
  controllers: [MetaController],
  providers: [MetaService,AiService],
  exports: [MetaService,AiService],
})
export class MetaModule {}
