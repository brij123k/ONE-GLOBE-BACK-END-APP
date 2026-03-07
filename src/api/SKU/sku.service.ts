import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { Shop } from 'src/schema/shop.schema';
import { SkuHistory } from 'src/schema/sku/sku-history.schema';
import { PRODUCTS_BY_IDS_QUERY } from 'src/graphql/sku/products-by-ids.query';
import { UPDATE_VARIANT_SKU_MUTATION } from 'src/graphql/sku/update-variant-sku.mutation';
import { GetSkuDto } from 'src/dto/sku/get-sku.dto';
import { UpdateSkuDto } from 'src/dto/sku/update-sku.dto';

export interface UpdateResult {
  variantId: string;
  oldSku: string;
  newSku: string;
  status: string;
}
@Injectable()
export class SkuService {
  constructor(
    
    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,

    @InjectModel(SkuHistory.name)
    private skuHistoryModel: Model<SkuHistory>,
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

  // =========================================
  // 📦 GET SKU DETAILS
  // =========================================
  async getProductsWithSku(shopId: string, dto: GetSkuDto) {
    const shop = await this.getShop(shopId);

    const data = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      PRODUCTS_BY_IDS_QUERY,
      { ids: dto.productIds },
    );

    return data.nodes.map((product: any) => ({
      productId: product.id,
      title: product.title,
      handle: product.handle,
      variants: product.variants.edges.map((v: any) => ({
        variantId: v.node.id,
        title: v.node.title,
        sku: v.node.sku,
        price: v.node.price,
        inventoryQuantity: v.node.inventoryQuantity,
        image: v.node.image?.url || null,
      })),
    }));
  }

async updateSku(shopId: string, dto: UpdateSkuDto) {

  const shop = await this.getShop(shopId);

  const results: UpdateResult[] = [];

  for (const item of dto.updates) {

    if (item.oldSku === item.newSku) {
      results.push({
        variantId: item.variantId,
        oldSku: item.oldSku,
        newSku: item.newSku,
        status: 'skipped',
      });
      continue;
    }

    try {

      const response = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        UPDATE_VARIANT_SKU_MUTATION,
        {
          id: item.inventoryItemId,
          input: {
            sku: item.newSku,
          },
        },
      );

      const errors = response.inventoryItemUpdate.userErrors;

      if (errors && errors.length) {

        console.error('Shopify SKU Error:', errors);

        results.push({
          variantId: item.variantId,
          oldSku: item.oldSku,
          newSku: item.newSku,
          status: 'failed',
        });

        continue;
      }

      // Save history
      await this.skuHistoryModel.create({
        shopId,
        variantId: item.variantId,
        oldSku: item.oldSku,
        newSku: item.newSku,
      });

      results.push({
        variantId: item.variantId,
        oldSku: item.oldSku,
        newSku: item.newSku,
        status: 'updated',
      });

    } catch (error) {

      console.error(
        'SKU UPDATE ERROR:',
        error?.response?.data || error.message || error,
      );

      results.push({
        variantId: item.variantId,
        oldSku: item.oldSku,
        newSku: item.newSku,
        status: 'error',
      });

    }
  }

  return {
    message: 'SKU update process completed',
    updatedCount: results.filter(r => r.status === 'updated').length,
    results,
  };
}
}