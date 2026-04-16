import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ShopifyModule } from 'src/common/shopify/shopify.module';
import { Shop, ShopSchema } from 'src/schema/shop.schema';
import { DeleteController } from './delete.controller';
import { DeleteService } from './delete.service';
import { DeleteProduct,DeleteProductSchema } from 'src/schema/delete/shopify-product.schema';
@Module({
  
  imports: [
      ShopifyModule,
    MongooseModule.forFeature([
      {name: DeleteProduct.name, schema: DeleteProductSchema},
      { name: Shop.name, schema: ShopSchema },
    ]),
  ],
  controllers: [DeleteController],
  providers: [DeleteService],
})
export class DeleteModule {}