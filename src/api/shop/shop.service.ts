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
  ) { }

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

  const limit = Number(params.limit) || 20;
  const after = params.after || null;
  const before = params.before || null;

  // ---------------- COLLECTION IDS ----------------
  let collectionIds: string[] = [];

  if (params.collections) {
    if (Array.isArray(params.collections)) {
      collectionIds = params.collections;
    } else if (typeof params.collections === "string") {
      collectionIds = params.collections.split(",").map((id) => id.trim());
    }
  }

  const { query } = buildProductSearchQuery(params);

  // =================================================
  // COLLECTION MODE
  // =================================================
  if (collectionIds.length > 0) {
    // ⚠️ pagination only safe for SINGLE collection
    const collectionId = collectionIds[0];

    const variables: any = {
      collectionId,
    };

    if (before) {
      variables.last = limit;
      variables.before = before;
    } else {
      variables.first = limit;
      variables.after = after;
    }

    const data = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      COLLECTION_PRODUCTS_QUERY,
      variables,
    );

    return {
      products: data.collection.products.edges,
      pageInfo: data.collection.products.pageInfo,
    };
  }

  // =================================================
  // NORMAL SEARCH MODE
  // =================================================
  const variables: any = {
    query,
  };

  if (before) {
    variables.last = limit;
    variables.before = before;
  } else {
    variables.first = limit;
    variables.after = after;
  }

  const data = await this.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    PRODUCTS_QUERY,
    variables,
  );

  return {
    products: data.products.edges,
    pageInfo: data.products.pageInfo,
  };
}

  async getVendors(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getVendors($first: Int!, $after: String) {
      productVendors(first: $first, after: $after) {
        edges {
          node
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const vendors = new Set<string>();

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.productVendors.edges.forEach(e => vendors.add(e.node));

      if (!data.productVendors.pageInfo.hasNextPage) break;
      cursor = data.productVendors.pageInfo.endCursor;
    }

    return {
      count: vendors.size,
      vendors: Array.from(vendors).sort(),
    };
  }

  async getProductTypes(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getProductTypes($first: Int!, $after: String) {
      productTypes(first: $first, after: $after) {
        edges {
          node
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const types = new Set<string>();

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.productTypes.edges.forEach(e => {
        if (e.node) types.add(e.node);
      });

      if (!data.productTypes.pageInfo.hasNextPage) break;
      cursor = data.productTypes.pageInfo.endCursor;
    }

    return {
      count: types.size,
      productTypes: Array.from(types).sort(),
    };
  }

  async getProductTags(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getProductTags($first: Int!, $after: String) {
      productTags(first: $first, after: $after) {
        edges {
          node
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const tags = new Set<string>();

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.productTags.edges.forEach(e => {
        if (e.node) tags.add(e.node);
      });

      if (!data.productTags.pageInfo.hasNextPage) break;
      cursor = data.productTags.pageInfo.endCursor;
    }

    return {
      count: tags.size,
      tags: Array.from(tags).sort(),
    };
  }

  async getCategories(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getCollections($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        edges {
          node {
            id
            title
            handle
            productsCount {
              count
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const categories: any[] = [];

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.collections.edges.forEach(e => {
        categories.push({
          id: e.node.id,
          title: e.node.title,
          handle: e.node.handle,
          productsCount: e.node.productsCount?.count || 0,
        });
      });

      if (!data.collections.pageInfo.hasNextPage) break;
      cursor = data.collections.pageInfo.endCursor;
    }

    return {
      count: categories.length,
      categories,
    };
  }

  async getCollections(shopId: string) {
    const shop = await this.getShop(shopId);

    let cursor: string | null = null;
    const collections: CollectionResponseDto[] = [];

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        COLLECTIONS_QUERY,
        { first: 250, after: cursor }, // 🔥 increased from 50 → 250
      );

      const edges = data?.collections?.edges || [];

      for (const edge of edges) {
        const node = edge?.node;
        if (!node) continue;

        collections.push({
          id: node.id,
          title: node.title,
          handle: node.handle,
          productsCount: node.productsCount?.count ?? 0,
        });
      }

      if (!data?.collections?.pageInfo?.hasNextPage) break;
      cursor = data.collections.pageInfo.endCursor;
    }

    // Optional: sort alphabetically
    collections.sort((a, b) => a.title.localeCompare(b.title));

    return {
      count: collections.length,
      collections,
    };
  }
}
