import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Shop, ShopDocument } from '../../schema/shop.schema';
import { CreateShopDto } from '../../dto/shop/create-shop.dto';
import { buildProductSearchQuery } from 'src/utils/product-query.builder';
import { COLLECTION_PRODUCTS_QUERY } from 'src/graphql/collection-products.query';
import { PRODUCTS_QUERY } from 'src/graphql/products.query';
import { COLLECTIONS_QUERY } from 'src/graphql/collections.query';
import { CollectionResponseDto } from 'src/dto/collection-response.dto';
import { AiService } from 'src/config/ai.service';

@Injectable()
export class ShopService {
  private readonly startupAuditCacheTtlMs = 6 * 60 * 60 * 1000;

  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<ShopDocument>,
    private readonly aiService: AiService,
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

  private async getShopByName(shopName: string) {
    const value = shopName.trim();
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const shop = await this.shopModel.findOne({
      $or: [
        { shopName: new RegExp(`^${escaped}$`, 'i') },
        { shopDomain: new RegExp(`^${escaped}$`, 'i') },
        { shopDomain: new RegExp(escaped, 'i') },
      ],
    }).lean();

    if (!shop) {
      throw new BadRequestException(`Shop not found for "${shopName}"`);
    }

    return shop;
  }

  private isFreshStartupAudit(shop: any) {
    if (!shop?.startupSeoAudit || !shop?.startupSeoAuditGeneratedAt) {
      return false;
    }

    const generatedAt = new Date(shop.startupSeoAuditGeneratedAt).getTime();
    if (Number.isNaN(generatedAt)) return false;

    return Date.now() - generatedAt < this.startupAuditCacheTtlMs;
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

  const limit = Number(params.limit) || 50;
  const after = params.after || null;
  const before = params.before || null;

  const { query } = buildProductSearchQuery(params);

  const variables: any = { query };

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

  const totalCount = data.productsCount?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    products: data.products.edges,
    pageInfo: data.products.pageInfo,
    totalCount,
    totalPages,
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

  private parseJsonResponse(raw: string) {
    if (!raw?.trim()) {
      throw new BadRequestException('AI returned an empty response');
    }

    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new BadRequestException('AI did not return valid JSON');
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new BadRequestException('AI returned malformed JSON');
    }
  }

  private buildSeoAuditPrompt(
    storeContext: any,
    competitorContext: any,
  ): string {
    const competitors = Array.isArray(competitorContext?.competitors)
      ? competitorContext.competitors
      : [];

    const prompt = `Act as a senior SEO consultant, AEO expert, GEO specialist, and ecommerce technical SEO auditor.
Audit the store using the context below and return JSON only.

Store:
${JSON.stringify(storeContext, null, 2)}

Competitors:
${JSON.stringify(competitorContext, null, 2)}

Audit requirements:
- Analyze all 12 areas: technical, on-page, homepage, collection/category, product, content/blog, E-E-A-T, AEO, GEO, off-page, conversion, local/international.
- For each section provide: strengths, weaknesses, criticalIssues, actionableFixes, priorityLevel.
- Be specific, practical, and brutally honest.
- No generic advice.

Return valid JSON only with this exact structure:
{
  "overallSeoScore": number,
  "TechnicalSEO":number,
  "On-PageSEO":number,
  "HomepageSEO":number,
  "ProductPageSEO":number,
  "CollectionSEO":number,
  "ConversionSEO":number,
  "seoAudit": {
    "technicalSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "onPageSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "homepageSeoAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "collectionCategoryPageAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "productPageAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "contentBlogAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "eeatAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "aeoAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "geoAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "offPageSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "conversionSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "localInternationalSeo": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    }
  },
  "quickWins": string[],
  "actionPlan30_60_90": {
    "day30": string[],
    "day60": string[],
    "day90": string[]
  },
  "competitorGapAnalysis": string[],
  "keywordOpportunities": string[],
  "contentCalendarSuggestions": string[]
}`;

    return prompt;
  }

  async generateStartupSeoAudit(shopName: string) {
    if (!shopName?.trim()) {
      throw new BadRequestException('shopName is required');
    }

    const shop = await this.getShopByName(shopName);

    if (this.isFreshStartupAudit(shop)) {
      const generatedAt = new Date(shop.startupSeoAuditGeneratedAt as Date).getTime();
      return {
        ...shop.startupSeoAudit,
        cached: true,
        cacheAgeHours: Number(((Date.now() - generatedAt) / (1000 * 60 * 60)).toFixed(2)),
      };
    }

    const [products, collections, vendors, productTypes, categories, tags] =
      await Promise.all([
        this.getProducts(shop._id.toString(), { limit: 20 }),
        this.getCollections(shop._id.toString()),
        this.getVendors(shop._id.toString()),
        this.getProductTypes(shop._id.toString()),
        this.getCategories(shop._id.toString()),
        this.getProductTags(shop._id.toString()),
      ]);

    const storeContext = {
      websiteUrl: `https://${shop.shopDomain}`,
      brandName: shop.shopName,
      businessType:
        productTypes.productTypes?.[0] ||
        categories.categories?.[0]?.title ||
        'Ecommerce Store',
      targetMarket: shop.country || 'Global',
      mainProducts:
        products.products?.slice(0, 8).map((item: any) => item.node.title) || [],
      productsCount: products.totalCount,
      collectionsCount: collections.count,
      vendorsCount: vendors.count,
      productTypes: productTypes.productTypes || [],
      tags: tags.tags?.slice(0, 50) || [],
      categories: categories.categories?.slice(0, 20) || [],
      sampleProducts:
        products.products?.slice(0, 10).map((item: any) => ({
          title: item.node.title,
          handle: item.node.handle,
          vendor: item.node.vendor,
          productType: item.node.productType,
          seoTitle: item.node.seo?.title || '',
          seoDescription: item.node.seo?.description || '',
          status: item.node.status,
        })) || [],
      collections: collections.collections?.slice(0, 20) || [],
      vendors: vendors.vendors?.slice(0, 30) || [],
    };

    const competitorPrompt = `
You are an ecommerce market research assistant.
Analyze the following Shopify store snapshot and return valid JSON only.

Return this exact shape:
{
  "brandName": string,
  "websiteUrl": string,
  "businessType": string,
  "targetMarket": string,
  "mainProducts": string[],
  "competitors": [
    {
      "name": string,
      "url": string,
      "whyRelevant": string
    }
  ]
}

Store Snapshot:
${JSON.stringify(storeContext, null, 2)}

Rules:
- Infer the business type from the store data.
- Pick 3 to 6 real competitor stores if possible.
- Prefer ecommerce brands that sell similar products to this store.
- Keep the output practical and specific.
- Return JSON only.`;

    let competitorContext: any;
    let audit: any;

    try {
      const competitorRaw = await this.aiService.generateJsonContent(
        'You are a precise ecommerce research analyst. Return JSON only.',
        competitorPrompt,
        {
          type: 'object',
          properties: {
            brandName: { type: 'string' },
            websiteUrl: { type: 'string' },
            businessType: { type: 'string' },
            targetMarket: { type: 'string' },
            mainProducts: {
              type: 'array',
              items: { type: 'string' },
            },
            competitors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  whyRelevant: { type: 'string' },
                },
                required: ['name', 'url', 'whyRelevant'],
              },
            },
          },
          required: [
            'brandName',
            'websiteUrl',
            'businessType',
            'targetMarket',
            'mainProducts',
            'competitors',
          ],
        },
        0.2,
      );

      competitorContext = this.parseJsonResponse(competitorRaw);

      const auditPrompt = this.buildSeoAuditPrompt(
        {
          ...storeContext,
          brandName:
            competitorContext.brandName || storeContext.brandName,
          businessType:
            competitorContext.businessType || storeContext.businessType,
          targetMarket:
            competitorContext.targetMarket || storeContext.targetMarket,
          mainProducts:
            competitorContext.mainProducts?.length
              ? competitorContext.mainProducts
              : storeContext.mainProducts,
        },
        competitorContext,
      );

      const auditRaw = await this.aiService.generateJsonContent(
        'You are a senior SEO consultant. Return valid JSON only.',
        auditPrompt,
        {
          type: 'object',
          properties: {
            overallSeoScore: { type: 'number' },
            TechnicalSEO: { type: 'number' },
            'On-PageSEO': { type: 'number' },
            HomepageSEO: { type: 'number' },
            ProductPageSEO: { type: 'number' },
            CollectionSEO: { type: 'number' },
            ConversionSEO: { type: 'number' },
            seoAudit: {
              type: 'object',
              properties: {
                technicalSeoAudit: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                onPageSeoAudit: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                homepageSeoAnalysis: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                collectionCategoryPageAudit: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                productPageAudit: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                contentBlogAudit: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                eeatAnalysis: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                aeoAnalysis: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                geoAnalysis: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                offPageSeoAudit: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                conversionSeoAudit: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
                localInternationalSeo: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                    criticalIssues: { type: 'array', items: { type: 'string' } },
                    actionableFixes: { type: 'array', items: { type: 'string' } },
                    priorityLevel: { type: 'string' },
                  },
                  required: ['strengths', 'weaknesses', 'criticalIssues', 'actionableFixes', 'priorityLevel'],
                },
              },
              required: [
                'technicalSeoAudit',
                'onPageSeoAudit',
                'homepageSeoAnalysis',
                'collectionCategoryPageAudit',
                'productPageAudit',
                'contentBlogAudit',
                'eeatAnalysis',
                'aeoAnalysis',
                'geoAnalysis',
                'offPageSeoAudit',
                'conversionSeoAudit',
                'localInternationalSeo',
              ],
            },
            quickWins: { type: 'array', items: { type: 'string' } },
            actionPlan30_60_90: {
              type: 'object',
              properties: {
                day30: { type: 'array', items: { type: 'string' } },
                day60: { type: 'array', items: { type: 'string' } },
                day90: { type: 'array', items: { type: 'string' } },
              },
              required: ['day30', 'day60', 'day90'],
            },
            competitorGapAnalysis: { type: 'array', items: { type: 'string' } },
            keywordOpportunities: { type: 'array', items: { type: 'string' } },
            contentCalendarSuggestions: { type: 'array', items: { type: 'string' } },
          },
          required: [
            'overallSeoScore',
            'TechnicalSEO',
            'On-PageSEO',
            'HomepageSEO',
            'ProductPageSEO',
            'CollectionSEO',
            'ConversionSEO',
            'seoAudit',
            'quickWins',
            'actionPlan30_60_90',
            'competitorGapAnalysis',
            'keywordOpportunities',
            'contentCalendarSuggestions',
          ],
        },
        0.35,
      );

      audit = this.parseJsonResponse(auditRaw);
    } catch (error: any) {
      throw error;
    }

    const result = {
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        shopDomain: shop.shopDomain,
        websiteUrl: `https://${shop.shopDomain}`,
        country: shop.country,
        owner:shop.owner,
        email:shop.email,
        currency: shop.currency,
        plan: shop.plan,
      },
      storeContext,
      competitorResearch: competitorContext,
      seoAudit: audit,
      cached: false,
    };

    await this.shopModel.findByIdAndUpdate(shop._id, {
      $set: {
        startupSeoAudit: result,
        startupSeoAuditGeneratedAt: new Date(),
      },
    });

    return result;
  }
}
