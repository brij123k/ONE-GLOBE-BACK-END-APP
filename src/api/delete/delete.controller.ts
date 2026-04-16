import { Controller, Post, Body, Delete } from '@nestjs/common';
import { DeleteService } from './delete.service';

@Controller('delete')
export class DeleteController {
  constructor(private readonly deleteService: DeleteService) {}

  // ✅ Fetch + Store
  @Post('sync')
  async syncProducts(@Body() filters: any) {
    return this.deleteService.fetchAndStoreProducts(filters);
  }

  // ✅ Delete from Shopify
  @Delete('delete')
  async deleteProducts() {
    return this.deleteService.deleteStoredProductsFromShopify();
  }

  // ✅ Restore to Shopify
  @Post('restore')
  async restoreProducts() {
    return this.deleteService.restoreProductsToShopify();
  }
}