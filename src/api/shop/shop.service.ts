import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Shop, ShopDocument } from '../../schema/shop.schema';
import { CreateShopDto } from '../../dto/shop/create-shop.dto';
import { buildProductSearchQuery } from 'src/utils/product-query.builder';
import { COLLECTION_PRODUCTS_QUERY } from 'src/graphql/collection-products.query';
import { PRODUCTS_QUERY } from 'src/graphql/products.query';
import { VENDORS_QUERY } from 'src/graphql/vendors.query';
import { COLLECTIONS_QUERY } from 'src/graphql/collections.query';
import { CollectionResponseDto } from 'src/dto/collection-response.dto';

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<ShopDocument>,
  ) {}

  async createOrUpdateShop(data: CreateShopDto) {
    return this.shopModel.findOneAndUpdate(
      { shopDomain: data.shopDomain },
      { ...data, isActive: true },
      { upsert: true, new: true },
    );
  }

  async exchangeCodeForToken(shop: string, code: string) {
    const response = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      },
    );

    return response.data.access_token;
  }

  async getShopDetails(shop: string, accessToken: string) {
    const response = await axios.get(
      `https://${shop}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      },
    );

    return response.data.shop;
  }


 private async getShop(shopId: string) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new UnauthorizedException('Invalid shop');
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

  async getProducts(shopId: string, params: any) {
    const shop = await this.getShop(shopId);
    // console.log(params.limit)
    const limit = Number(params.limit)|| 250;
    const cursor = params.cursor || null;
    const collectionId = params.collections;
    const query = buildProductSearchQuery(params);

    if (collectionId) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        COLLECTION_PRODUCTS_QUERY,
        { collectionId, first: limit, after: cursor },
      );

      return {
        products: data.collection?.products?.edges ?? [],
        pageInfo: data.collection?.products?.pageInfo,
      };
    }

    const data = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      PRODUCTS_QUERY,
      { first: limit, after: cursor, query },
    );

    return {
      products: data.products.edges,
      pageInfo: data.products.pageInfo,
    };
  }

  async getVendors(shopId: string) {
    const shop = await this.getShop(shopId);

    let cursor = null;
    const vendors = new Set<string>();

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        VENDORS_QUERY,
        { first: 100, after: cursor },
      );

      data.products.edges.forEach(e => {
        if (e.node.vendor) vendors.add(e.node.vendor);
      });

      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
    }

    return {
      count: vendors.size,
      vendors: Array.from(vendors).sort(),
    };
  }

  async getCollections(shopId: string) {
    const shop = await this.getShop(shopId);

    let cursor = null;
    const collections: CollectionResponseDto[] = [];

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        COLLECTIONS_QUERY,
        { first: 50, after: cursor },
      );

      data.collections.edges.forEach(e => {
        collections.push({
          id: e.node.id,
          title: e.node.title,
          handle: e.node.handle,
          productsCount: e.node.productsCount.count,
        });
      });

      if (!data.collections.pageInfo.hasNextPage) break;
      cursor = data.collections.pageInfo.endCursor;
    }

    return {
      count: collections.length,
      collections,
    };
  }
}
