import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Shop } from 'src/schema/shop.schema';
import { UPDATE_PRODUCT_VENDOR_MUTATION } from 'src/graphql/update-product-vendor.mutation';
import { VendorHistory } from 'src/schema/vendor/vendor-history.schema';
import { UpdateVendorDto } from 'src/dto/vender/update-vendor.dto';
import axios from 'axios';
import { OptimizeVendorDto } from 'src/dto/vender/optimize-vendor.dto';
import { AiService } from 'src/config/ai.service';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { VENDOR_AI_QUERY } from 'src/graphql/vendor/vendor-ai.query';
import { UPDATE_VENDOR_MUTATION } from 'src/graphql/vendor/update-vendor.mutation';
export interface VendorUpdateResult { 
  productId: string;
  status: 'updated' | 'skipped' | 'failed' | 'error';
}
@Injectable()
export class VendorService {

  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,

    @InjectModel(VendorHistory.name)
    private vendorHistoryModel: Model<VendorHistory>,

    private readonly aiService: AiService,
    private readonly shopifyService: ShopifyService,
  ) {}

  private async getShop(shopId: string) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error('Invalid shop');
    return shop;
  }

    async updateProductType(
      shopId: string,
      dto: UpdateVendorDto,
    ) {
  
      const shop = await this.shopModel.findById(shopId).lean();
      if (!shop) throw new Error("Invalid shop");
  
  
      const response = await this.shopifyService.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        UPDATE_VENDOR_MUTATION,
        {
          input: {
            id: dto.productId,
            vendor: dto.newVendor,
          }
        }
      );
  
  
      const errors = response.productUpdate.userErrors;
  
      if (errors?.length) {
        throw new Error(JSON.stringify(errors));
      }
  
  
      await this.vendorHistoryModel.create({
        shopId,
        productId: dto.productId,
        oldVendor: dto.oldVendor,
        newVendor: dto.newVendor,
      });
  
  
      return {
        message: "Product type updated successfully",
        updatedCount:1
      };
  
    }

}