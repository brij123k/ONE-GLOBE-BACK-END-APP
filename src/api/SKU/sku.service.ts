import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { Shop } from 'src/schema/shop.schema';
import { SkuHistory } from 'src/schema/sku/sku-history.schema';
import { CREATE_METAFIELD_DEFINITION } from 'src/graphql/metafields/create-metafield-definition.query';
import { SET_PRODUCT_METAFIELD } from 'src/graphql/metafields/set-product-metafield.query';
import { CHECK_METAFIELD_DEFINITION_QUERY } from 'src/graphql/metafields/check-metafield-definition.query';
import { PRODUCTS_BY_IDS_QUERY } from 'src/graphql/sku/products-by-ids.query';
import { UPDATE_VARIANT_SKU_MUTATION } from 'src/graphql/sku/update-variant-sku.mutation';
import { GetSkuDto } from 'src/dto/sku/get-sku.dto';
import { UpdateSkuDto } from 'src/dto/sku/update-sku.dto';
import { SkuOptimization } from 'src/schema/sku/skuOptimization.schema';

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

    @InjectModel(SkuOptimization.name)
    private skuModel: Model<SkuOptimization>,
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

  private async findSkuMetafieldDefinition(shop: any) {
    let after: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        CHECK_METAFIELD_DEFINITION_QUERY,
        {
          first: 100,
          after,
          ownerType: 'PRODUCT',
        },
      );

      const definition = data.metafieldDefinitions.edges.find(
        (edge: any) =>
          edge.node.namespace === 'custom' &&
          edge.node.key === 'sku',
      );

      if (definition) {
        return definition.node;
      }

      hasNextPage = data.metafieldDefinitions.pageInfo.hasNextPage;
      after = data.metafieldDefinitions.pageInfo.endCursor;
    }

    return null;
  }

  private async ensureSkuMetafieldDefinition(shop: any) {
    const existingDefinition = await this.findSkuMetafieldDefinition(shop);

    if (existingDefinition) {
      return existingDefinition;
    }

    const createResponse = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      CREATE_METAFIELD_DEFINITION,
      {
        definition: {
          name: 'SKU',
          namespace: 'custom',
          key: 'sku',
          type: 'single_line_text_field',
          ownerType: 'PRODUCT',
          access: {
            storefront: 'PUBLIC_READ',
          },
        },
      },
    );

    const userErrors = createResponse.metafieldDefinitionCreate.userErrors || [];

    if (userErrors.length) {
      const retryDefinition = await this.findSkuMetafieldDefinition(shop);

      if (retryDefinition) {
        return retryDefinition;
      }

      throw new Error(userErrors[0].message);
    }

    return createResponse.metafieldDefinitionCreate.createdDefinition;
  }

  private async storeOldSkuInProductMetafield(
    shop: any,
    productId: string,
    oldSku: string,
  ) {
    const response = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      SET_PRODUCT_METAFIELD,
      {
        metafields: [
          {
            ownerId: productId,
            namespace: 'custom',
            key: 'sku',
            type: 'single_line_text_field',
            value: oldSku,
          },
        ],
      },
    );

    const errors = response.metafieldsSet.userErrors || [];

    if (errors.length) {
      throw new Error(errors[0].message);
    }

    return response.metafieldsSet.metafields;
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
  await this.ensureSkuMetafieldDefinition(shop);

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
      await this.storeOldSkuInProductMetafield(
        shop,
        item.productId,
        item.oldSku,
      );
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
        productId: item.productId,
        variantId: item.variantId,
        oldSku: item.oldSku,
        newSku: item.newSku,
      });

    await this.skuModel.findOneAndUpdate(
    {
      productId: item.productId,
      variantId: item.variantId
    },
    {
      $set: { sku: item.newSku }
    },
    {
      new: true // optional: returns updated document
    }
  );

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
