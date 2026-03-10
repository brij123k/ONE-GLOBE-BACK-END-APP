import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';

import { Shop } from 'src/schema/shop.schema';
import { ProductTypeHistory } from 'src/schema/product-type/product-type-history.schema';
import { UpdateProductTypeDto } from 'src/dto/product-type/update-product-type.dto';
import { UPDATE_PRODUCT_TYPE_MUTATION } from 'src/graphql/update-product-type.mutation';

export interface ProductTypeResult {
  productId: string;
  status: 'updated' | 'skipped' | 'failed' | 'error';
}

@Injectable()
export class ProductTypeService {

  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,

    @InjectModel(ProductTypeHistory.name)
    private productTypeHistoryModel: Model<ProductTypeHistory>,
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

  async updateProductType(shopId: string, dto: UpdateProductTypeDto) {

    const shop = await this.getShop(shopId);

    const results: ProductTypeResult[] = [];

    for (const item of dto.updates) {

      if (item.oldProductType === item.newProductType) {

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
          UPDATE_PRODUCT_TYPE_MUTATION,
          {
            input: {
              id: item.productId,
              productType: item.newProductType,
            },
          },
        );

        const errors = response.productUpdate.userErrors;

        if (errors?.length) {

          console.error("PRODUCT TYPE UPDATE ERROR:", errors);

          results.push({
            productId: item.productId,
            status: 'failed',
          });

          continue;
        }

        await this.productTypeHistoryModel.create({
          shopId,
          productId: item.productId,
          oldProductType: item.oldProductType,
          newProductType: item.newProductType,
        });

        results.push({
          productId: item.productId,
          status: 'updated',
        });

      } catch (error) {

        console.error("PRODUCT TYPE UPDATE ERROR:", error);

        results.push({
          productId: item.productId,
          status: 'error',
        });

      }

    }

    return {
      message: 'Product Type update completed',
      updatedCount: results.filter(r => r.status === 'updated').length,
      results,
    };

  }

}