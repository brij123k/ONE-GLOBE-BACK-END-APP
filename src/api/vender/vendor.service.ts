import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Shop } from 'src/schema/shop.schema';
import { UPDATE_PRODUCT_VENDOR_MUTATION } from 'src/graphql/update-product-vendor.mutation';
import { VendorHistory } from 'src/schema/vendor/vendor-history.schema';
import { UpdateVendorDto } from 'src/dto/vender/update-vendor.dto';
import axios from 'axios';
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
  ) {}

  private async getShop(shopId: string) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error('Invalid shop');
    return shop;
  }
  private async shopifyRequest(
      shopDomain: string,
      accessToken: string,
      query: string,
      variables: any,
    ) {
      const url = `https://${shopDomain}/admin/api/2026-01/graphql.json`;
  
      const { data } = await axios.post(
        url,
        { query, variables },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        },
      );
  
      if (data.errors) throw data.errors;
      return data.data;
    }
  async updateVendor(shopId: string, dto: UpdateVendorDto) {

    const shop = await this.getShop(shopId);

    const results: VendorUpdateResult[] = [];

    for (const item of dto.updates) {

      if (item.oldVendor === item.newVendor) {
        results.push({
          productId: item.productId,
          status: 'skipped',
        });
        continue;
      }

      try {

        const response = await this.shopifyRequest(
          shop.shopDomain,
          shop.accessToken,
          UPDATE_PRODUCT_VENDOR_MUTATION,
          {
            input: {
              id: item.productId,
              vendor: item.newVendor,
            },
          },
        );

        const errors = response.productUpdate.userErrors;

        if (errors.length) {
          results.push({
            productId: item.productId,
            status: 'failed',
          });
          continue;
        }

        await this.vendorHistoryModel.create({
          shopId,
          productId: item.productId,
          oldVendor: item.oldVendor,
          newVendor: item.newVendor,
        });

        results.push({
          productId: item.productId,
          status: 'updated',
        });

      } catch (error) {

        console.error('VENDOR UPDATE ERROR:', error);

        results.push({
          productId: item.productId,
          status: 'error',
        });

      }

    }

    return {
      message: 'Vendor update completed',
      updatedCount: results.filter(r => r.status === 'updated').length,
      results,
    };

  }

}