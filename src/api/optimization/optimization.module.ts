import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OptimizationController } from './optimization.controller';
import { OptimizationService } from './optimization.service';

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
import { ClassicTitleOptimized, ClassicTitleOptimizedSchema } from 'src/schema/title/classic-title-optimized.schema';
import { ClassicDescriptionOptimized, ClassicDescriptionOptimizedSchema } from 'src/schema/descriptions/classic-description-optimized.schema';
import { AiService } from 'src/config/ai.service';
import { OptimizedMetaTitle,OptimizedMetaTitleSchema } from 'src/schema/meta-title/optimized-meta-title.schema';
import { OptimizedMetaDescription, OptimizedMetaDescriptionSchema } from 'src/schema/meta-description/optimized-meta-description.schema';
import { OptimizedImage,OptimizedImageSchema } from 'src/schema/image/optimized-image.schema';
@Module({
  imports: [
    AuthModule,
    ShopifyModule,
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
    ]),
    MongooseModule.forFeature([
      { name: OptimizedTitle.name, schema: OptimizedTitleSchema },
      { name: OptimizedDescription.name, schema: OptimizedDescriptionSchema },
      { name: ClassicTitleOptimized.name, schema: ClassicTitleOptimizedSchema },
      { name: ClassicDescriptionOptimized.name, schema: ClassicDescriptionOptimizedSchema },
      { name: OptimizedMetaTitle.name, schema: OptimizedMetaTitleSchema },
      { name: OptimizedMetaDescription.name, schema: OptimizedMetaDescriptionSchema },
      { name: OptimizedImage.name, schema: OptimizedImageSchema },
    ]),
  ],
  controllers: [OptimizationController],
  providers: [OptimizationService,AiService],
  exports: [OptimizationService,AiService],
})
export class OptimizationModule {}
