import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { PRODUCTIDS_QUERY } from 'src/graphql/productIds.query';
import { UPDATE_PRODUCT_TITLE_MUTATION } from 'src/graphql/update-product-title';
import { Shop } from 'src/schema/shop.schema';
import { ClassicTitleOptimized } from 'src/schema/title/classic-title-optimized.schema';
import { buildProductSearchQuery } from 'src/utils/product-query.builder';

@Injectable()
export class ReviertService {
    constructor(
        private readonly shopifyService: ShopifyService,
        @InjectModel(Shop.name) private shopModel: Model<Shop>,
        @InjectModel(ClassicTitleOptimized.name)
        private titleModel: Model<ClassicTitleOptimized>,
    ) { }

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

    async reviertGet(
  shopId: string,
  serviceName: string,
  filters?: any,
  productIds?: string[],
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  switch (serviceName) {
    case 'title':
      return this.getTitleRevert(shopId, shop, filters, productIds);

    default:
      throw new Error('Invalid serviceName');
  }
}

async revertSave(
  shopId: string,
  serviceName: string,
  filters?: any,
  productIds?: string[],
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  switch (serviceName) {
    case 'title':
      return this.revertTitle(shopId, shop, filters, productIds);

    default:
      throw new Error('Invalid serviceName');
  }
}

    async getTitleRevert(
  shopId: string,
  shop: any,
  filters?: any,
  productIds?: string[],
) {
  let finalProductIds: string[] = [];

  // ==============================
  // CASE 1: productIds provided
  // ==============================
  if (productIds && productIds.length > 0) {
    finalProductIds = productIds;
  }

  // ==============================
  // CASE 2: No productIds → Use Filters
  // ==============================
  else if (filters) {
    const { query } = buildProductSearchQuery(filters);

    const variables = {
      query,
      first: 250, // no pagination, just max limit
    };

    const data = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      PRODUCTIDS_QUERY,
      variables,
    );

    const shopifyProducts = data.products.edges || [];

    finalProductIds = shopifyProducts.map(
      (edge: any) => edge.node.id,
    );
  }

  // ==============================
  // If still no IDs → return empty
  // ==============================
  if (!finalProductIds.length) {
    return [];
  }

  // ==============================
  // Get Only Existing Data from DB
  // ==============================
  const existingData = await this.titleModel.find({
    shopId,
    productId: { $in: finalProductIds },
  });

  return existingData;
}

async revertTitle(
  shopId: string,
  shop: any,
  filters?: any,
  productIds?: string[],
) {
  let finalProductIds: string[] = [];
  if (productIds && productIds.length > 0) {
    finalProductIds = productIds;
  }

  else if (filters) {
  const { query } = buildProductSearchQuery(filters);

    const variables = {
      query,
      first: 250,
    };

    const data = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      PRODUCTIDS_QUERY,
      variables,
    );

    finalProductIds = data.products.edges.map(
      (edge: any) => edge.node.id,
    );
  }

  if (!finalProductIds.length) {
    return { success: true, reverted: 0 };
  }

  const revertRecords = await this.titleModel.find({
    shopId,
    productId: { $in: finalProductIds },
  });

  if (!revertRecords.length) {
    return { success: true, reverted: 0 };
  }

  let revertedCount = 0;

  for (const record of revertRecords) {
    await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      UPDATE_PRODUCT_TITLE_MUTATION,
      {
        input: {
          id: record.productId,
          title: record.oldTitle,
        },
      },
    );
    await this.titleModel.deleteOne({productId:record.productId})
    revertedCount++;
  }

  return {
    success: true,
    reverted: revertedCount,
  };
}

}